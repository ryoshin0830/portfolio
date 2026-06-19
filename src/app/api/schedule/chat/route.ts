import { NextResponse } from "next/server";
import { isHermesConfigured } from "@/lib/hermes";
import { getChatSuggestion } from "@/lib/scheduling";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import type { ChatMessage } from "@/types/scheduling";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * POST /api/schedule/chat
 * body: { messages: ChatMessage[], locale?: string }
 * 訪問者の自然言語リクエストを Hermes に渡し、AI の返答＋空き枠の提案を返す。
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

  const messages = Array.isArray(body.messages) ? body.messages : [];
  // 入力サニタイズ: 役割を制限し、長すぎる本文は切り詰める（プロンプト肥大・悪用対策）。
  const clean: ChatMessage[] = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 500) }))
    .slice(-8);
  if (clean.length === 0 || clean[clean.length - 1].role !== "user") {
    return NextResponse.json({ error: "no_user_message" }, { status: 400 });
  }

  const locale = typeof body.locale === "string" ? body.locale : "ja";

  try {
    const result = await getChatSuggestion(clean, locale);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[schedule] chat failed:", err);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
