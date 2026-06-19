import { hermesChat, extractJson } from "@/lib/hermes";
import type {
  AvailabilityResponse,
  BookingRequest,
  BookingResult,
  BusyInterval,
  SchedulingConfig,
  Slot,
} from "@/types/scheduling";

/**
 * 日程調整のサーバー側ロジック。
 *
 * 設計方針: LLM（Hermes）には「曖昧になりがちな計算」をさせない。
 *   - Hermes に任せるのは ①その日の busy 区間の読み取り ②イベント作成 の 2 つだけ
 *   - 空き枠の算出（営業時間 × 枠長 − busy − 過去 − リードタイム）は、この
 *     ファイルの純関数で決定論的に行う（テスト可能・再現性あり）
 *
 * タイムゾーン: オーナーを Asia/Tokyo（固定 +09:00, DST 無し）前提で扱うため、
 * 日付ライブラリ無しで ISO 文字列を直接組み立てられる。他地域（DST あり）へ
 * 展開する場合はここを Intl ベースに作り直すこと。
 */

export const DEFAULT_CONFIG: SchedulingConfig = {
  timezone: process.env.SCHEDULING_TIMEZONE || "Asia/Tokyo",
  utcOffset: process.env.SCHEDULING_UTC_OFFSET || "+09:00",
  startHour: Number(process.env.SCHEDULING_START_HOUR ?? 10),
  endHour: Number(process.env.SCHEDULING_END_HOUR ?? 18),
  slotMinutes: Number(process.env.SCHEDULING_SLOT_MINUTES ?? 30),
  leadMinutes: Number(process.env.SCHEDULING_LEAD_MINUTES ?? 120),
  excludeWeekends: process.env.SCHEDULING_EXCLUDE_WEEKENDS !== "false",
  horizonDays: Number(process.env.SCHEDULING_HORIZON_DAYS ?? 30),
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" を検証する。 */
export function isValidDateString(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  // 実在日かどうか（2026-02-30 等を弾く）
  const dt = new Date(`${date}T00:00:00Z`);
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() + 1 === m &&
    dt.getUTCDate() === d
  );
}

/** 指定日（オーナー TZ）の曜日（0=日 … 6=土）。固定オフセットなので正午で判定する。 */
function weekdayInOwnerTz(date: string, cfg: SchedulingConfig): number {
  return new Date(`${date}T12:00:00${cfg.utcOffset}`).getUTCDay();
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** 分（オーナー TZ の 0:00 起点）→ "HH:mm" ラベル。 */
function minutesToLabel(minutesFromMidnight: number): string {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

/** 分（オーナー TZ の 0:00 起点）→ その日の ISO8601（オフセット付き）。 */
function minutesToIso(date: string, minutesFromMidnight: number, cfg: SchedulingConfig): string {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  return `${date}T${pad2(h)}:${pad2(m)}:00${cfg.utcOffset}`;
}

/**
 * 営業時間から候補枠を生成し、busy 区間・過去・リードタイムで除外して空き枠を返す。
 * 純関数（now を引数で受ける）なのでテストしやすい。
 */
export function computeOpenSlots(
  date: string,
  busy: BusyInterval[],
  cfg: SchedulingConfig,
  now: Date,
): Slot[] {
  if (cfg.excludeWeekends) {
    const wd = weekdayInOwnerTz(date, cfg);
    if (wd === 0 || wd === 6) return [];
  }

  const earliest = now.getTime() + cfg.leadMinutes * 60_000;
  const busyRanges = busy
    .map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) }))
    .filter((b) => Number.isFinite(b.start) && Number.isFinite(b.end));

  const slots: Slot[] = [];
  const startMin = cfg.startHour * 60;
  const endMin = cfg.endHour * 60;
  for (let m = startMin; m + cfg.slotMinutes <= endMin; m += cfg.slotMinutes) {
    const startIso = minutesToIso(date, m, cfg);
    const endIso = minutesToIso(date, m + cfg.slotMinutes, cfg);
    const s = Date.parse(startIso);
    const e = Date.parse(endIso);
    // 過去 / リードタイム内は除外
    if (s < earliest) continue;
    // busy と少しでも重なる枠は除外（半開区間で判定: s < busy.end && e > busy.start）
    const overlaps = busyRanges.some((b) => s < b.end && e > b.start);
    if (overlaps) continue;
    slots.push({ start: startIso, end: endIso, label: minutesToLabel(m) });
  }
  return slots;
}

/** Hermes に指定日の busy 区間を JSON で問い合わせる。 */
export async function getBusyIntervals(
  date: string,
  cfg: SchedulingConfig,
): Promise<BusyInterval[]> {
  const system =
    "You are a calendar availability service for the site owner. " +
    "You have access to the owner's primary Google Calendar. " +
    "Return ONLY a minified JSON object, no prose, no code fences.";
  const user =
    `List the owner's busy time intervals on ${date} (timezone ${cfg.timezone}). ` +
    `Consider the full day 00:00–24:00. ` +
    `Respond with exactly: {"busy":[{"start":"<ISO8601 with offset>","end":"<ISO8601 with offset>"}]}. ` +
    `If the owner has no events that day, respond {"busy":[]}.`;

  const text = await hermesChat([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
  const parsed = extractJson<{ busy?: BusyInterval[] }>(text);
  if (!parsed.busy || !Array.isArray(parsed.busy)) return [];
  return parsed.busy.filter(
    (b) =>
      b &&
      typeof b.start === "string" &&
      typeof b.end === "string" &&
      Number.isFinite(Date.parse(b.start)) &&
      Number.isFinite(Date.parse(b.end)),
  );
}

/** 指定日の空き枠を返す（busy 取得 → 決定論的に枠計算）。 */
export async function getAvailability(
  date: string,
  cfg: SchedulingConfig = DEFAULT_CONFIG,
  now: Date = new Date(),
): Promise<AvailabilityResponse> {
  const busy = await getBusyIntervals(date, cfg);
  const slots = computeOpenSlots(date, busy, cfg, now);
  return { date, timezone: cfg.timezone, slots };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 予約を確定する。確定前にその枠がまだ空いているか再検証し（二重予約防止）、
 * 問題なければ Hermes に Google Calendar イベント作成を依頼する。
 */
export async function createBooking(
  req: BookingRequest,
  cfg: SchedulingConfig = DEFAULT_CONFIG,
  now: Date = new Date(),
): Promise<BookingResult> {
  // ── 入力検証 ────────────────────────────────────────────
  // ハニーポット: 人間は触れない隠しフィールド。埋まっていればボットとみなす。
  if (req.company && req.company.trim() !== "") {
    return { ok: false, error: "spam_detected" };
  }
  if (!req.name?.trim()) return { ok: false, error: "name_required" };
  if (!EMAIL_RE.test(req.email ?? "")) return { ok: false, error: "invalid_email" };
  const startMs = Date.parse(req.start);
  const endMs = Date.parse(req.end);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return { ok: false, error: "invalid_slot" };
  }
  if (startMs < now.getTime() + cfg.leadMinutes * 60_000) {
    return { ok: false, error: "slot_in_past" };
  }

  // ── 空き再確認 + イベント作成を 1 回の Hermes 呼び出しで（アトミック）──────
  // 確認と作成を別々の往復にすると遅延が倍になり Vercel の実行時間上限に近づくため、
  // エージェントに「空いていれば作成、埋まっていれば作らず slot_taken を返す」を一括で
  // 任せる。これで二重予約チェックも作成も 1 ターンで完結する。
  const safeName = req.name.trim().slice(0, 80);
  const safeNote = (req.note ?? "").trim().slice(0, 500);
  const system =
    "You are a booking service for the site owner. You can read and create events " +
    "on the owner's primary Google Calendar. Return ONLY a minified JSON object, no prose.";
  const user =
    `First, check the owner's PRIMARY Google Calendar for any conflicting event ` +
    `overlapping ${req.start} to ${req.end} (timezone ${cfg.timezone}). ` +
    `If there is a conflict, do NOT create anything and respond exactly {"ok":false,"error":"slot_taken"}. ` +
    `If the slot is free, create a Google Calendar event on the PRIMARY calendar with these exact details:\n` +
    `- summary: "Meeting with ${safeName}"\n` +
    `- start: ${req.start} (timezone ${cfg.timezone})\n` +
    `- end: ${req.end} (timezone ${cfg.timezone})\n` +
    `- attendee email: ${req.email}\n` +
    `- description: ${safeNote || "(no message)"}\n` +
    `- add a Google Meet video conference link\n` +
    `- send email invitations to all guests\n` +
    `After creating it, respond with exactly: ` +
    `{"ok":true,"htmlLink":"<event url>","meetUrl":"<meet url or empty string>"}. ` +
    `If creation fails, respond {"ok":false,"error":"<short reason>"}.`;

  const text = await hermesChat([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
  const parsed = extractJson<BookingResult>(text);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error || "creation_failed" };
  }
  return {
    ok: true,
    htmlLink: typeof parsed.htmlLink === "string" ? parsed.htmlLink : undefined,
    meetUrl: typeof parsed.meetUrl === "string" && parsed.meetUrl ? parsed.meetUrl : undefined,
  };
}
