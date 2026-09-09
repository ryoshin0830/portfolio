import { NextResponse } from "next/server";
import { isGoogleConfigured } from "@/lib/google-calendar";
import {
  DEFAULT_CONFIG,
  findSlotsInRange,
  ownerToday,
  pickInitialSlots,
} from "@/lib/scheduling";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs"; // googleapis は Node 依存。Edge 不可。
// キャッシュ禁止。ページ本体は revalidate=60 の SSG なので、ここで枠を焼き込むと
// 古い候補が静的 HTML に入ってしまう。空き状況は毎回取り直す。
export const dynamic = "force-dynamic";

/** 初回提示の探索窓（日）。pickInitialSlots が最大 4 日ぶんに間引く。 */
const INITIAL_RANGE_DAYS = 14;

/**
 * GET /api/schedule/initial-slots
 *
 * 初回表示用の空き枠。**LLM を一切通らない。** 以前は訪問者の初回描画のために
 * "PROPOSE_INITIAL_SLOTS_IN_XX" をエージェントに投げており、実測で 15 秒かかって
 * いた（LLM 2 回）。内容は決定論的なので、ここで直接 Google を見て間引いて返す。
 *
 * 返すのは時刻だけ。予定名・場所・参加者、および busy 区間は返さない
 * （/api/schedule/chat と同じセキュリティ境界）。
 */
export async function GET(req: Request) {
  if (!isGoogleConfigured()) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  if (!rateLimit(`initial-slots:${clientIp(req)}`, 30, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  try {
    const cfg = DEFAULT_CONFIG;
    const now = new Date();
    const start = ownerToday(cfg, now).date;
    const end = ownerToday(cfg, new Date(now.getTime() + INITIAL_RANGE_DAYS * 86_400_000)).date;

    const found = await findSlotsInRange(start, end, cfg, now);
    return NextResponse.json({
      timezone: found.timezone,
      slots: pickInitialSlots(found.slots),
    });
  } catch (err) {
    console.error("[schedule] initial slots failed:", err);
    return NextResponse.json({ ok: false, error: "upstream_error" }, { status: 502 });
  }
}
