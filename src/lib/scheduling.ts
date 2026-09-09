import { fetchBusy, fetchCalendarEventContexts, insertEvent } from "@/lib/google-calendar";
import type {
  AvailabilityResponse,
  BookingRequest,
  BookingResult,
  BusyInterval,
  CalendarEventContext,
  SchedulingConfig,
  Slot,
} from "@/types/scheduling";

/**
 * 日程調整のサーバー側ロジック。
 *
 * 設計方針:
 *   - カレンダーI/O（busy 取得・イベント作成）は Google Calendar を**直接**叩く
 *     （`@/lib/google-calendar`、OAuth2 本人実行、サブ秒）。Hermes/トンネルは廃止。
 *   - 空き枠の算出（営業時間 × 枠長 − busy − 移動パディング − 過去 − リードタイム）は、この
 *     ファイルの純関数で決定論的に行う（テスト可能・再現性あり）。
 *   - 移動要否の判定も決定論的なルール（`needsTravelPadding`）で行う。以前はここで
 *     LLM に分類させていたが、1 回 19〜21 秒かかりチャットが Vercel の 60 秒制限で
 *     切れる主因だったうえ、判定はヒューリスティックの上書きでほぼ捨てられていた。
 *   - 自然言語の解釈は Mastra エージェント（`@/mastra`）が担い、ここの純関数を
 *     ツール経由で呼ぶ。予定名・場所はこのファイルの内部判定にだけ使い、
 *     エージェント／ブラウザには「パディング適用後の空き時刻」しか渡さない（漏洩対策）。
 *
 * タイムゾーン: オーナーを Asia/Tokyo（固定 +09:00, DST 無し）前提で扱うため、
 * 日付ライブラリ無しで ISO 文字列を直接組み立てられる。他地域（DST あり）へ
 * 展開する場合はここを Intl ベースに作り直すこと。
 */

function parseEnvInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    console.warn('[scheduling] env ' + key + '="' + raw + '" is not a number, using default ' + fallback);
    return fallback;
  }
  return n;
}

export const DEFAULT_CONFIG: SchedulingConfig = {
  timezone: process.env.SCHEDULING_TIMEZONE || "Asia/Tokyo",
  utcOffset: process.env.SCHEDULING_UTC_OFFSET || "+09:00",
  startHour: parseEnvInt("SCHEDULING_START_HOUR", 9),
  // 夜も受け付ける（24 = 深夜0時まで。既定の最終枠は 23:00–24:00）。
  endHour: parseEnvInt("SCHEDULING_END_HOUR", 24),
  // 既定の会議時間（要望で長さ指定が無いときのフォールバック）。
  slotMinutes: parseEnvInt("SCHEDULING_SLOT_MINUTES", 60),
  leadMinutes: parseEnvInt("SCHEDULING_LEAD_MINUTES", 120),
  travelPaddingBeforeMinutes: parseEnvInt("SCHEDULING_TRAVEL_PADDING_BEFORE_MINUTES", 60),
  travelPaddingAfterMinutes: parseEnvInt("SCHEDULING_TRAVEL_PADDING_AFTER_MINUTES", 60),
  // 週末も受け付ける（除外したいときだけ SCHEDULING_EXCLUDE_WEEKENDS=true）。
  excludeWeekends: process.env.SCHEDULING_EXCLUDE_WEEKENDS === "true",
  horizonDays: parseEnvInt("SCHEDULING_HORIZON_DAYS", 30),
};

/** 会議時間の上限（分）。エージェントが極端に長い枠を返すのを防ぐ安全弁。 */
const MAX_SLOT_MINUTES = 720;

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
  if (!m) {
    console.warn('[scheduling] Invalid utcOffset="' + offset + '", expected +HH:MM or -HH:MM format');
    return 0;
  }
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
  return timestampToIso(ms, cfg);
}

/** UTC timestamp(ms) → ISO8601（オーナー TZ の固定オフセット付き）。 */
function timestampToIso(ms: number, cfg: SchedulingConfig): string {
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
  /** 指定範囲の予定あり時間帯。移動パディングを含むが、タイトル等は含まない。 */
  busy: BusyInterval[];
  /** 指定範囲で予約可能な空き枠の全件。 */
  slots: Slot[];
}

/** 開始“分”(0:00起点) がどの時間帯かを返す（"any" は返さない）。 */
function partOfDayOf(startMin: number): Exclude<PartOfDay, "any"> {
  const h = Math.floor(startMin / 60);
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/** 開始“分”(0:00起点) が指定の時間帯に入るか。 */
function inPartOfDay(startMin: number, part: PartOfDay): boolean {
  if (part === "any") return true;
  return partOfDayOf(startMin) === part;
}

const ONLINE_SIGNAL_RE =
  /(online|remote|video|call|phone|zoom|google\s*meet|\bmeet\b|teams|webex|slack huddle|オンライン|リモート|在宅|電話|通話|ビデオ|视讯|视频|线上|在线|远程)/i;

/**
 * `location` が「実世界の場所」を指しているか。
 *
 * `sanitizeCalendarText` が URL を `[url]` に置換するため、Meet/Zoom のリンクだけが
 * 入っている場所は `[url]` として届く。場所名自体がオンラインを意味する場合
 * （"Zoom", "オンライン" 等）も物理的な場所ではない。
 */
function hasPhysicalLocation(location: string | undefined): boolean {
  const text = location?.trim();
  if (!text) return false;
  if (text === "[url]") return false;
  return !ONLINE_SIGNAL_RE.test(text);
}

/**
 * 既存予定の前後に移動パディングを入れるべきかを決定論的に判定する。
 *
 * 判定順（上から評価）:
 *   1. 実在の場所が入っていれば移動あり。**オンライン会議リンクが併存していても
 *      移動あり**とする（外出先からオンライン会議に出るケースがあるため安全側）。
 *      これは旧 LLM 分類器が実際に効いていた唯一のケースをルール化したもの。
 *   2. オンライン会議リンクがある、または予定名・場所にオンライン語彙があれば移動なし。
 *   3. どちらのシグナルも無ければ移動あり。判定を誤ってパディングが欠けると
 *      「提示した枠が予約できない」バグになるため、安全側に倒す。
 *
 * `transparency === "transparent"` の予定は `fetchCalendarEventContexts` が
 * 既に除外しているのでここには来ない。
 */
export function needsTravelPadding(event: CalendarEventContext): boolean {
  if (hasPhysicalLocation(event.location)) return true;
  if (event.hasConference) return false;
  if (ONLINE_SIGNAL_RE.test(`${event.summary ?? ""} ${event.location ?? ""}`)) return false;
  return true;
}

function mergeBusyIntervals(intervals: BusyInterval[], cfg: SchedulingConfig): BusyInterval[] {
  const ranges = intervals
    .map((interval) => ({
      start: Date.parse(interval.start),
      end: Date.parse(interval.end),
    }))
    .filter((interval) => (
      Number.isFinite(interval.start) &&
      Number.isFinite(interval.end) &&
      interval.end > interval.start
    ))
    .sort((a, b) => a.start - b.start);

  const merged: { start: number; end: number }[] = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }

  return merged.map((range) => ({
    start: timestampToIso(range.start, cfg),
    end: timestampToIso(range.end, cfg),
  }));
}

function applyTravelPadding(
  busy: BusyInterval[],
  events: CalendarEventContext[],
  cfg: SchedulingConfig,
): BusyInterval[] {
  const beforeMs = Math.max(0, cfg.travelPaddingBeforeMinutes) * 60_000;
  const afterMs = Math.max(0, cfg.travelPaddingAfterMinutes) * 60_000;
  if (events.length === 0 || (beforeMs === 0 && afterMs === 0)) {
    return mergeBusyIntervals(busy, cfg);
  }

  const padding: BusyInterval[] = [];

  for (const event of events) {
    if (!needsTravelPadding(event)) continue;

    const start = Date.parse(event.start);
    const end = Date.parse(event.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;

    if (beforeMs > 0) {
      padding.push({
        start: timestampToIso(start - beforeMs, cfg),
        end: timestampToIso(start, cfg),
      });
    }
    if (afterMs > 0) {
      padding.push({
        start: timestampToIso(end, cfg),
        end: timestampToIso(end + afterMs, cfg),
      });
    }
  }

  return mergeBusyIntervals([...busy, ...padding], cfg);
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
  // ステップは 30 分刻み固定とする。枠長は duration（刻みより長くてもよい）。
  const stepMinutes = 30;
  for (let m = startMin; m + duration <= endMin; m += stepMinutes) {
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

/**
 * 進行中の unavailable 取得（範囲キー → Promise）。
 *
 * エージェントは 1 メッセージで find-slots を複数本（枠長 30 分用・60 分用など）
 * 同時に呼ぶ。移動パディング判定は枠長に依存しないので、同じ範囲の取得を
 * 並列で二重に走らせても結果は同じで、Google API 呼び出しだけが倍になる。
 *
 * **完了した結果はキャッシュしない**（解決したら即座に削除する）。`createBooking`
 * は確定直前に空き状況を取り直して二重予約を防いでいるため、完了済みの結果を
 * 再利用するとその再検証が意味を失う。共有するのは「今まさに飛んでいる取得」
 * だけなので、鮮度は一切落ちない。
 */
const inFlightUnavailable = new Map<string, Promise<BusyInterval[]>>();

async function getUnavailableIntervals(
  timeMinIso: string,
  timeMaxIso: string,
  cfg: SchedulingConfig,
): Promise<BusyInterval[]> {
  const key = `${timeMinIso}|${timeMaxIso}|${cfg.travelPaddingBeforeMinutes}|${cfg.travelPaddingAfterMinutes}`;
  // 戻り値は必ずコピーして返す。`busy` は FindSlotsResult としてモジュール外へ出るので、
  // 共有した配列インスタンスを渡すと片方の呼び出し元の破壊的操作がもう片方に漏れる。
  const inFlight = inFlightUnavailable.get(key);
  if (inFlight) return [...(await inFlight)];

  const pending = fetchUnavailableIntervals(timeMinIso, timeMaxIso, cfg);
  inFlightUnavailable.set(key, pending);
  try {
    return [...(await pending)];
  } finally {
    inFlightUnavailable.delete(key);
  }
}

async function fetchUnavailableIntervals(
  timeMinIso: string,
  timeMaxIso: string,
  cfg: SchedulingConfig,
): Promise<BusyInterval[]> {
  const [busy, eventContexts] = await Promise.all([
    fetchBusy(timeMinIso, timeMaxIso),
    fetchCalendarEventContexts(timeMinIso, timeMaxIso),
  ]);
  return applyTravelPadding(busy, eventContexts, cfg);
}

/** 指定日の unavailable 区間を取得（移動パディング込み。予定の中身は返さない）。 */
export async function getBusyIntervals(
  date: string,
  cfg: SchedulingConfig,
): Promise<BusyInterval[]> {
  const dayStart = minutesToIso(date, -cfg.travelPaddingAfterMinutes, cfg);
  const dayEnd = minutesToIso(date, 24 * 60 + cfg.travelPaddingBeforeMinutes, cfg);
  return getUnavailableIntervals(dayStart, dayEnd, cfg);
}

/** 指定日の空き枠を返す（busy + 移動パディング取得 → 決定論的に枠計算）。 */
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
 * チャットエージェントには、移動パディング適用後の busy 時間帯と空き枠を全件渡す。
 * イベントタイトル・場所・説明・参加者などの詳細は含めない。
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
  const busy = await getUnavailableIntervals(
    minutesToIso(start, -cfg.travelPaddingAfterMinutes, cfg),
    minutesToIso(end, 24 * 60 + cfg.travelPaddingBeforeMinutes, cfg),
    cfg,
  );
  const out: Slot[] = [];
  for (let d = start; d <= end; d = nextDate(d, cfg)) {
    const daySlots = computeOpenSlots(d, busy, cfg, now, opts);
    out.push(...daySlots);
  }
  return { timezone: cfg.timezone, busy, slots: out };
}

/** 初回表示で提示する枠の既定上限。 */
const INITIAL_MAX_DAYS = 4;
const INITIAL_MAX_SLOTS = 8;

/**
 * 初回表示用に、空き枠から「散らした少数の候補」を決定論的に選ぶ。
 *
 * 以前は "PROPOSE_INITIAL_SLOTS_IN_XX" をエージェントに投げ、「30分と60分を混ぜて
 * 朝昼夜に散らして早い日を優先して ~6 件」を毎回 LLM に判断させていた。内容は
 * 決定論的なのでルールに落とし、初回表示から LLM を外した。
 *
 * ルール: 空きのある日を早い順に最大 `maxDays` 日拾い、各日で 朝(<12)/昼(12-17)/
 * 夜(17-) ごとに最初の 1 枠だけ採る。全体で `maxSlots` 件まで。
 *
 * `slots` は `findSlotsInRange` の出力（時刻順）を前提とし、出力も時刻順を保つ。
 */
export function pickInitialSlots(
  slots: Slot[],
  opts: { maxDays?: number; maxSlots?: number } = {},
): Slot[] {
  const maxDays = Math.max(0, opts.maxDays ?? INITIAL_MAX_DAYS);
  const maxSlots = Math.max(0, opts.maxSlots ?? INITIAL_MAX_SLOTS);
  if (maxDays === 0 || maxSlots === 0) return [];

  const picked: Slot[] = [];
  // 日付ごとに、既に採用した時間帯を覚える。日付は ISO 先頭 10 文字
  // （オーナー TZ は固定オフセットなのでこれで日付が一意に決まる）。
  const takenPartsByDate = new Map<string, Set<PartOfDay>>();

  for (const slot of slots) {
    if (picked.length >= maxSlots) break;

    const date = slot.start.slice(0, 10);
    let takenParts = takenPartsByDate.get(date);
    if (!takenParts) {
      if (takenPartsByDate.size >= maxDays) break; // 対象日を使い切った
      takenParts = new Set();
      takenPartsByDate.set(date, takenParts);
    }

    const [hour, minute] = slot.label.split(":").map(Number);
    const part = partOfDayOf(hour * 60 + minute);
    if (takenParts.has(part)) continue;

    takenParts.add(part);
    picked.push(slot);
  }

  return picked;
}

/**
 * 予約要求の (start, end) が「実際に提示されうる枠」かを決定論的に検証する。
 *
 * 営業時間・30分グリッド・枠長・週末除外・リードタイム・horizon を一括で担保するため、
 * busy 無しで構造的な候補枠を生成し、要求が**厳密一致**するかを照合する。これにより
 * find-slots が生成しない時刻（深夜・グリッド外・営業時間外・遠い未来）を `/api/schedule/book`
 * に直接 POST して予約する濫用を防ぐ。実際の空き(busy 競合)は createBooking が別途 slot_taken で扱う。
 */
export function isOfferableSlot(
  startIso: string,
  endIso: string,
  cfg: SchedulingConfig = DEFAULT_CONFIG,
  now: Date = new Date(),
): boolean {
  const startMs = Date.parse(startIso);
  const endMs = Date.parse(endIso);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return false;

  const durationMinutes = Math.round((endMs - startMs) / 60_000);
  if (durationMinutes < 5 || durationMinutes > MAX_SLOT_MINUTES) return false;

  // 開始時刻(オーナー TZ)から対象日を求める。
  const date = timestampToIso(startMs, cfg).slice(0, 10);

  // horizon（今日〜今日+horizonDays）の範囲内か。
  const today = ownerToday(cfg, now).date;
  const horizon = ownerToday(cfg, new Date(now.getTime() + cfg.horizonDays * 86_400_000)).date;
  if (date < today || date > horizon) return false;

  // busy 無しで「営業時間 × 30分グリッド × 枠長 − 過去/リード − 週末」の候補を生成し、
  // 要求枠が ISO で厳密一致する候補を持つか確認する。
  const candidates = computeOpenSlots(date, [], cfg, now, { durationMinutes });
  return candidates.some(
    (s) => Date.parse(s.start) === startMs && Date.parse(s.end) === endMs,
  );
}

function stripBidiAndControlChars(s: string): string {
  return s.replace(/[​-‏‪-‮⁦-⁩﻿­]/g, '');
}

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
  // name は型ガード（route が zod 検証しても、ツール経路・直接呼び出しに備える）。
  if (typeof req.name !== "string" || !req.name.trim()) {
    return { ok: false, error: "name_required" };
  }
  if (typeof req.start !== "string" || typeof req.end !== "string") {
    return { ok: false, error: "invalid_slot" };
  }
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
  // 提示されうる枠か（営業時間・グリッド・週末・horizon）。直 POST 濫用を防ぐ。
  if (!isOfferableSlot(req.start, req.end, cfg, now)) {
    return { ok: false, error: "slot_not_offered" };
  }

  // ── 二重予約チェック（確定直前に移動パディング込みで取り直す）──────────────
  // findSlotsInRange と同じ日単位の範囲で問い合わせる。スロット前後だけの狭い範囲だと
  // LLM に渡すイベントバッチが findSlotsInRange と異なり、同一イベントの移動判定が
  // 変わって「提示した枠が予約できない」バグを起こす。
  const slotDate = timestampToIso(startMs, cfg).slice(0, 10);
  const busy = await getUnavailableIntervals(
    minutesToIso(slotDate, -cfg.travelPaddingAfterMinutes, cfg),
    minutesToIso(slotDate, 24 * 60 + cfg.travelPaddingBeforeMinutes, cfg),
    cfg,
  );
  const conflict = busy.some(
    (b) => startMs < Date.parse(b.end) && endMs > Date.parse(b.start),
  );
  if (conflict) return { ok: false, error: "slot_taken" };

  // ── イベント作成（オーナー本人として実行＝招待メール＋Meet が効く）──────
  const safeName = stripBidiAndControlChars(req.name.trim()).slice(0, 80);
  const safeNote = stripBidiAndControlChars((req.note ?? "").trim()).slice(0, 500);
  const description = safeNote
    ? `${safeNote}\n---\nCreated via ryosh.in scheduling`
    : "Created via ryosh.in scheduling";
  try {
    const ev = await insertEvent({
      summary: `[ryosh.in] Meeting with ${safeName}`,
      startIso: req.start,
      endIso: req.end,
      timeZone: cfg.timezone,
      description,
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
