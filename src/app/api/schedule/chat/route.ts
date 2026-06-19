import { NextResponse } from "next/server";
import { isHermesConfigured } from "@/lib/hermes";
import { getChatSuggestion } from "@/lib/scheduling";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import type { ChatMessage } from "@/types/scheduling";

export const runtime = "nodejs";
// オープン探索は ~60s かかることがあるため余裕を持たせる。
// 注: 60s 超は Vercel Pro 以上が必要（Hobby は 60s で打ち切り）。
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * POST /api/schedule/chat  （Server-Sent Events ストリーミング）
 * body: { messages: ChatMessage[], locale?: string }
 *
 * Hermes(= hermes -z) はトークンを逐次出力できず、完了後に JSON を一括で返す。
 * そこでこのルートが UX を補う:
 *   1. 待機中は `status` イベント（経過秒）を 1.5s ごとに流し、画面が固まって
 *      見えないようにする。
 *   2. Hermes 完了後、返答文を 1 文字ずつ `delta` で送って typewriter 表示にする。
 *   3. 最後に `slots`（検証済みの提案枠）→ `end` を送る。
 * これにより「無音で60秒」が「ずっと動いていて最後に文字が流れる」体験になる。
 */
export async function POST(req: Request) {
  if (!isHermesConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  if (!rateLimit(`chat:${clientIp(req)}`, 15, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { messages?: ChatMessage[]; locale?: string };
  try {
    body = (await req.json()) as { messages?: ChatMessage[]; locale?: string };
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const clean: ChatMessage[] = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 500) }))
    .slice(-8);
  if (clean.length === 0 || clean[clean.length - 1].role !== "user") {
    return NextResponse.json({ error: "no_user_message" }, { status: 400 });
  }
  const locale = typeof body.locale === "string" ? body.locale : "ja";

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // ── 待機中ハートビート（Hermes が返るまで経過秒を流し続ける）──
      let finished = false;
      const t0 = Date.now();
      const heartbeat = (async () => {
        // 即座に最初の status を出して「受信した」ことを伝える
        send("status", { elapsed: 0 });
        while (!finished) {
          await sleep(1500);
          if (finished) break;
          send("status", { elapsed: Math.round((Date.now() - t0) / 1000) });
        }
      })();

      try {
        const result = await getChatSuggestion(clean, locale);
        finished = true;
        await heartbeat;

        // ── 返答を 1 文字ずつ（typewriter）──
        const reply = result.reply || "";
        // Intl.Segmenter があれば書記素単位（絵文字・結合文字対応）、無ければコードポイント単位。
        const SegmenterCtor = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
        const units: string[] = SegmenterCtor
          ? Array.from(new SegmenterCtor(locale, { granularity: "grapheme" }).segment(reply), (s) => s.segment)
          : Array.from(reply);
        for (const ch of units) {
          send("delta", { text: ch });
          await sleep(14);
        }

        send("slots", { slots: result.slots });
        send("end", {});
      } catch (err) {
        finished = true;
        await heartbeat;
        console.error("[schedule] chat stream failed:", err);
        send("error", { error: "upstream_error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      // Vercel/プロキシでのバッファリングを抑止して即時フラッシュする。
      "X-Accel-Buffering": "no",
    },
  });
}
