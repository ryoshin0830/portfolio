import { NextResponse } from "next/server";
import { isGoogleConfigured } from "@/lib/google-calendar";
import { getAvailability, isValidDateString } from "@/lib/scheduling";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// LLM + カレンダー往復を含むため Node ランタイム & 長めの実行上限（Vercel）。
export const runtime = "nodejs";
export const maxDuration = 60;
// 空き状況はリアルタイムなので必ず動的実行（キャッシュさせない）。
export const dynamic = "force-dynamic";

/**
 * GET /api/schedule/availability?date=YYYY-MM-DD
 * 指定日の予約可能枠を返す。Hermes(= Google Calendar) から busy を取得し、
 * 空き枠はサーバー側で決定論的に算出する（src/lib/scheduling.ts）。
 */
export async function GET(req: Request) {
  if (!isGoogleConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  // 読み取りでも LLM コストがかかるので軽く絞る（1 分 20 回 / IP）。
  if (!rateLimit(`avail:${clientIp(req)}`, 20, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? "";
  if (!isValidDateString(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  try {
    const availability = await getAvailability(date);
    return NextResponse.json(availability, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[schedule] availability failed:", err);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
