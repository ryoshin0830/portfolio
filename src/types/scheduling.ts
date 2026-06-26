/**
 * AI 日程調整機能の型契約。
 *
 * データフロー: ブラウザ ──/api/schedule/*──▶ Next.js(サーバー) ──▶ Google Calendar API
 * (OAuth2 直接)。秘密情報（Google 資格情報）は一切
 * クライアントに出さず、ブラウザには「空き枠リスト」と「予約結果」だけ返す。
 */

/** Google Calendar から取得した予定済み区間。ISO8601（オフセット付き）。 */
export interface BusyInterval {
  start: string;
  end: string;
}

/**
 * 移動パディング判定だけに使う、サーバー内部用の最小予定情報。
 * 参加者・説明・URL は含めない。ブラウザや訪問者向け応答には出さない。
 */
export interface CalendarEventContext {
  id: string;
  start: string;
  end: string;
  /** 短くサニタイズした予定名。移動判定の補助用で、外部表示は禁止。 */
  summary?: string;
  /** 短くサニタイズした場所。移動判定の補助用で、外部表示は禁止。 */
  location?: string;
  eventType?: string;
  transparency?: string;
  hasConference: boolean;
}

/** 予約可能な 1 枠。label はオーナー TZ で整形済み（例 "10:00"）。 */
export interface Slot {
  /** 開始 ISO8601（オフセット付き、例 2026-06-25T10:00:00+09:00） */
  start: string;
  /** 終了 ISO8601 */
  end: string;
  /** オーナー TZ で整形済みの表示ラベル（例 "10:00"） */
  label: string;
}

/** GET /api/schedule/availability のレスポンス。 */
export interface AvailabilityResponse {
  /** 対象日（YYYY-MM-DD, オーナー TZ） */
  date: string;
  /** IANA タイムゾーン（例 Asia/Tokyo） */
  timezone: string;
  slots: Slot[];
}

/** POST /api/schedule/book のリクエストボディ。 */
export interface BookingRequest {
  /** 選択枠の開始 ISO8601 */
  start: string;
  /** 選択枠の終了 ISO8601 */
  end: string;
  /** 訪問者の名前（または仮称） */
  name: string;
  note?: string;
  /** ハニーポット。ボットだけが埋める隠しフィールド。空であることを必須とする。 */
  company?: string;
}

/** POST /api/schedule/book のレスポンス。 */
export interface BookingResult {
  ok: boolean;
  /** 作成されたイベントの Google Calendar URL */
  htmlLink?: string;
  /** 生成された Google Meet の URL */
  meetUrl?: string;
  /** 失敗時のメッセージ（クライアントには汎用文言を見せる用途） */
  error?: string;
}

/** 営業時間・枠長などの設定（サーバー側で空き枠を決定論的に計算するための入力）。 */
export interface SchedulingConfig {
  /** IANA タイムゾーン（固定 +09:00 前提、Asia/Tokyo は DST 無し） */
  timezone: string;
  /** 固定 UTC オフセット（例 "+09:00"）。DST のない地域のみ妥当。 */
  utcOffset: string;
  /** 営業開始時（オーナー TZ の時, 0-23） */
  startHour: number;
  /** 営業終了時（この時刻で終わる枠まで。例 18 なら 17:30-18:00 が最終枠） */
  endHour: number;
  /** 1 枠の長さ（分） */
  slotMinutes: number;
  /** 直近この分数以内の枠は予約不可（移動・準備のリードタイム） */
  leadMinutes: number;
  /** 移動が必要な既存予定の前に確保する時間（分） */
  travelPaddingBeforeMinutes: number;
  /** 移動が必要な既存予定の後に確保する時間（分） */
  travelPaddingAfterMinutes: number;
  /** 土日を除外するか */
  excludeWeekends: boolean;
  /** 今日から何日先まで予約を受け付けるか */
  horizonDays: number;
}
