import { NextResponse } from "next/server";
import { isGoogleConfigured } from "@/lib/google-calendar";
import { createBooking } from "@/lib/scheduling";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import type { BookingRequest } from "@/types/scheduling";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * POST /api/schedule/book
 * body: BookingRequest（start/end/name/email/note + ハニーポット company）
 * 確定直前に空き状況を再検証してから Hermes に Google Calendar イベントを作らせる。
 */
export async function POST(req: Request) {
  if (!isGoogleConfigured()) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  // 書き込みは厳しめに（5 分 5 回 / IP）。実運用では Upstash 等の外部ストアへ。
  if (!rateLimit(`book:${clientIp(req)}`, 5, 5 * 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: BookingRequest;
  try {
    body = (await req.json()) as BookingRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  try {
    const result = await createBooking(body);
    // 検証エラー（不正入力・枠埋まり・スパム）は 400、成功は 200。
    const status = result.ok ? 200 : result.error === "slot_taken" ? 409 : 400;
    return NextResponse.json(result, { status });
  } catch (err) {
    console.error("[schedule] booking failed:", err);
    return NextResponse.json({ ok: false, error: "upstream_error" }, { status: 502 });
  }
}
