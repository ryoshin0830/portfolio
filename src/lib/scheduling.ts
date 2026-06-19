import { fetchBusy, insertEvent } from "@/lib/google-calendar";
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
 * 設計方針:
 *   - カレンダーI/O（busy 取得・イベント作成）は Google Calendar を**直接**叩く
 *     （`@/lib/google-calendar`、OAuth2 本人実行、サブ秒）。Hermes/トンネルは廃止。
 *   - 空き枠の算出（営業時間 × 枠長 − busy − 過去 − リードタイム）は、この
 *     ファイルの純関数で決定論的に行う（テスト可能・再現性あり）。
 *   - 自然言語の解釈は Mastra エージェント（`@/mastra`）が担い、ここの純関数を
 *     ツール経由で呼ぶ。エージェントには「空き時刻」しか渡さない（漏洩対策）。
 *
 * タイムゾーン: オーナーを Asia/Tokyo（固定 +09:00, DST 無し）前提で扱うため、
 * 日付ライブラリ無しで ISO 文字列を直接組み立てられる。他地域（DST あり）へ
 * 展開する場合はここを Intl ベースに作り直すこと。
 */

export const DEFAULT_CONFIG: SchedulingConfig = {
  timezone: process.env.SCHEDULING_TIMEZONE || "Asia/Tokyo",
  utcOffset: process.env.SCHEDULING_UTC_OFFSET || "+09:00",
  startHour: Number(process.env.SCHEDULING_START_HOUR ?? 9),
  // 夜も受け付ける（24 = 深夜0時まで。最終枠は 23:30–24:00）。
  endHour: Number(process.env.SCHEDULING_END_HOUR ?? 24),
  // 既定の会議時間（要望で長さ指定が無いときのフォールバック）。
  slotMinutes: Number(process.env.SCHEDULING_SLOT_MINUTES ?? 30),
  leadMinutes: Number(process.env.SCHEDULING_LEAD_MINUTES ?? 120),
  // 週末も受け付ける（除外したいときだけ SCHEDULING_EXCLUDE_WEEKENDS=true）。
  excludeWeekends: process.env.SCHEDULING_EXCLUDE_WEEKENDS === "true",
  horizonDays: Number(process.env.SCHEDULING_HORIZON_DAYS ?? 30),
};

/** 会議時間の上限（分）。エージェントが極端に長い枠を返すのを防ぐ安全弁。 */
const MAX_SLOT_MINUTES = 240;

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

/** "+09:00" → 540（分）。 */
function parseOffsetMinutes(offset: string): number {
  const m = offset.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!m) return 0;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

/**
 * 分（オーナー TZ の 0:00 起点）→ ISO8601（オフセット付き）。
 * minutesFromMidnight が 1440(=24:00) 以上でも翌日へ正しく繰り上げる
 * （夜枠の終端 24:00 を "翌日00:00" として表現するため）。固定オフセット前提。
 */
function minutesToIso(date: string, minutesFromMidnight: number, cfg: SchedulingConfig): string {
  const baseMs = Date.parse(`${date}T00:00:00${cfg.utcOffset}`);
  const ms = baseMs + minutesFromMidnight * 60_000;
  // 固定オフセット分だけずらして UTC フィールドを読むと、その TZ の壁時計になる。
  const shifted = new Date(ms + parseOffsetMinutes(cfg.utcOffset) * 60_000);
  const y = shifted.getUTCFullYear();
  const mo = shifted.getUTCMonth() + 1;
  const d = shifted.getUTCDate();
  const h = shifted.getUTCHours();
  const mi = shifted.getUTCMinutes();
  return `${y}-${pad2(mo)}-${pad2(d)}T${pad2(h)}:${pad2(mi)}:00${cfg.utcOffset}`;
}

export type PartOfDay = "morning" | "afternoon" | "evening" | "any";

export interface SlotQueryOpts {
  /** 1 枠の長さ（分）。未指定なら cfg.slotMinutes。 */
  durationMinutes?: number;
  /** 時間帯フィルタ（morning <12 / afternoon 12-17 / evening 17- / any）。 */
  partOfDay?: PartOfDay;
}

export interface FindSlotsResult {
  timezone: string;
  /** 指定範囲の予定あり時間帯。Google freebusy 由来なのでタイトル等は含まない。 */
  busy: BusyInterval[];
  /** 指定範囲で予約可能な空き枠の全件。 */
  slots: Slot[];
}

/** 開始“分”(0:00起点) が指定の時間帯に入るか。 */
function inPartOfDay(startMin: number, part: PartOfDay): boolean {
  if (part === "any") return true;
  const h = Math.floor(startMin / 60);
  if (part === "morning") return h < 12;
  if (part === "afternoon") return h >= 12 && h < 17;
  return h >= 17; // evening
}

/**
 * 営業時間から候補枠を生成し、busy 区間・過去・リードタイム・時間帯で除外して空き枠を返す。
 * 純関数（now を引数で受ける）なのでテストしやすい。枠長は opts.durationMinutes で可変。
 */
export function computeOpenSlots(
  date: string,
  busy: BusyInterval[],
  cfg: SchedulingConfig,
  now: Date,
  opts: SlotQueryOpts = {},
): Slot[] {
  if (cfg.excludeWeekends) {
    const wd = weekdayInOwnerTz(date, cfg);
    if (wd === 0 || wd === 6) return [];
  }

  const duration = Math.max(5, Math.min(opts.durationMinutes ?? cfg.slotMinutes, MAX_SLOT_MINUTES));
  const part = opts.partOfDay ?? "any";
  const earliest = now.getTime() + cfg.leadMinutes * 60_000;
  const busyRanges = busy
    .map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) }))
    .filter((b) => Number.isFinite(b.start) && Number.isFinite(b.end));

  const slots: Slot[] = [];
  const startMin = cfg.startHour * 60;
  const endMin = cfg.endHour * 60;
  // ステップは枠の刻み（cfg.slotMinutes）。枠長は duration（刻みより長くてもよい）。
  for (let m = startMin; m + duration <= endMin; m += cfg.slotMinutes) {
    if (!inPartOfDay(m, part)) continue;
    const startIso = minutesToIso(date, m, cfg);
    const endIso = minutesToIso(date, m + duration, cfg);
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

/** 指定日の busy 区間を Google Calendar(freebusy) から取得（時刻のみ、予定の中身は含まれない）。 */
export async function getBusyIntervals(
  date: string,
  cfg: SchedulingConfig,
): Promise<BusyInterval[]> {
  const dayStart = minutesToIso(date, 0, cfg);
  const dayEnd = minutesToIso(date, 24 * 60, cfg);
  return fetchBusy(dayStart, dayEnd);
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

/** date(YYYY-MM-DD, owner TZ) を1日進める。月跨ぎも正しく繰り上げる。 */
function nextDate(date: string, cfg: SchedulingConfig): string {
  return minutesToIso(date, 24 * 60, cfg).slice(0, 10);
}

/**
 * 範囲 [startDate, endDate]（両端含む, YYYY-MM-DD）の空き枠を、1 回の freebusy 取得で計算。
 * 範囲は [今日, 今日+horizon] にクランプ。opts で枠長・時間帯を指定。Mastra の findSlots ツールから使う。
 *
 * LLM には判断材料として busy 時間帯と空き枠を全件渡す。busy は Google Calendar freebusy
 * 由来なので、イベントタイトル・説明・参加者などの詳細は含まれない。
 */
export async function findSlotsInRange(
  startDate: string,
  endDate: string,
  cfg: SchedulingConfig = DEFAULT_CONFIG,
  now: Date = new Date(),
  opts: SlotQueryOpts = {},
): Promise<FindSlotsResult> {
  const today = ownerToday(cfg, now).date;
  const horizon = ownerToday(cfg, new Date(now.getTime() + cfg.horizonDays * 86_400_000)).date;
  const start = startDate < today ? today : startDate;
  const end = endDate > horizon ? horizon : endDate;
  if (!isValidDateString(start) || !isValidDateString(end) || end < start) {
    return { timezone: cfg.timezone, busy: [], slots: [] };
  }
  const busy = await fetchBusy(minutesToIso(start, 0, cfg), minutesToIso(end, 24 * 60, cfg));
  const out: Slot[] = [];
  for (let d = start; d <= end; d = nextDate(d, cfg)) {
    const daySlots = computeOpenSlots(d, busy, cfg, now, opts);
    out.push(...daySlots);
  }
  return { timezone: cfg.timezone, busy, slots: out };
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
  if (endMs - startMs > MAX_SLOT_MINUTES * 60_000) {
    return { ok: false, error: "invalid_slot" };
  }
  if (startMs < now.getTime() + cfg.leadMinutes * 60_000) {
    return { ok: false, error: "slot_in_past" };
  }

  // ── 二重予約チェック（確定直前に freebusy を取り直す）──────────────────
  const busy = await fetchBusy(req.start, req.end);
  const conflict = busy.some(
    (b) => startMs < Date.parse(b.end) && endMs > Date.parse(b.start),
  );
  if (conflict) return { ok: false, error: "slot_taken" };

  // ── イベント作成（オーナー本人として実行＝招待メール＋Meet が効く）──────
  const safeName = req.name.trim().slice(0, 80);
  const safeNote = (req.note ?? "").trim().slice(0, 500);
  try {
    const ev = await insertEvent({
      summary: `Meeting with ${safeName}`,
      startIso: req.start,
      endIso: req.end,
      timeZone: cfg.timezone,
      attendeeEmail: req.email,
      description: safeNote || undefined,
    });
    return { ok: true, htmlLink: ev.htmlLink, meetUrl: ev.meetUrl };
  } catch (err) {
    console.error("[scheduling] insertEvent failed:", err);
    return { ok: false, error: "creation_failed" };
  }
}

/** オーナー TZ での今日（YYYY-MM-DD）と曜日英名を返す。 */
export function ownerToday(cfg: SchedulingConfig, now: Date): { date: string; weekday: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: cfg.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, weekday: get("weekday") };
}

// 自然言語の解釈（旧 getChatSuggestion）は Mastra エージェント（src/mastra）へ移行した。
// ここはカレンダーI/O＋決定論的な空き計算の純関数のみを提供する。
