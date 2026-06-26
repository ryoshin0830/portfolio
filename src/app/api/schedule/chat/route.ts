import { NextResponse } from "next/server";
import { handleChatStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";
import { mastra } from "@/mastra";
import { isGoogleConfigured } from "@/lib/google-calendar";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs"; // Mastra/googleapis は Node 依存。Edge 不可。
export const maxDuration = 30;
export const dynamic = "force-dynamic";

/**
 * POST /api/schedule/chat  — Mastra エージェント（DeepSeek）の本物トークンストリーミング。
 * body は AI SDK の useChat 形式（{ messages, ... }）。エージェントが find-slots / book-slot
 * ツールを呼んで応答する。カレンダーの中身はツールに渡さない（空き時刻のみ）。
 */
export async function POST(req: Request) {
  if (!isGoogleConfigured() || !process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  if (!rateLimit(`chat:${clientIp(req)}`, 15, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let params;
  try {
    const body = await req.json();
    const messages = body?.messages;
    if (!Array.isArray(messages) || messages.length > 50) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    params = { messages, trigger: body?.trigger };
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const stream = await handleChatStream({
      mastra,
      agentId: "scheduling",
      params,
      version: "v6", // ai@6 互換の UIMessage ストリームを返す
    });
    return createUIMessageStreamResponse({ stream });
  } catch (err) {
    console.error("[schedule] chat failed:", err);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
