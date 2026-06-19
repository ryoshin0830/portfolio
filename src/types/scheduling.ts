/**
 * AI 日程調整機能の型契約。
 *
 * データフロー: ブラウザ ──/api/schedule/*──▶ Next.js(サーバー) ──▶ Hermes(自宅Mac)
 * ──▶ Google Calendar。秘密情報（Hermes の API キー / Google 資格情報）は一切
 * クライアントに出さず、ブラウザには「空き枠リスト」と「予約結果」だけ返す。
 */

/** Hermes（= Google Calendar）から取得した予定済み区間。ISO8601（オフセット付き）。 */
export interface BusyInterval {
  start: string;
  end: string;
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
  name: string;
  email: string;
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

/** 会話 1 ターン（AI ネイティブなチャット日程調整用）。 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * 会話日程調整のサーバー内部結果。
 *
 * セキュリティ上、エージェント（Hermes）の自由記述テキストは**一切ユーザーに見せない**。
 * カレンダーの中身（予定名・参加者・詳細）が injection で漏れるのを防ぐため、エージェント
 * からは「予約可能枠（時刻のみ）」と「状態」だけを受け取り、ユーザー向け文言はサーバーの
 * テンプレートで生成する。
 */
export type ChatStatus = "ok" | "none" | "need_info";

export interface ChatResult {
  /** ok=枠あり / none=範囲内に空き無し / need_info=要望が曖昧で要確認 */
  status: ChatStatus;
  /** 予約可能枠（時刻のみ。予定の中身は一切含めない）。 */
  slots: Slot[];
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
  /** 土日を除外するか */
  excludeWeekends: boolean;
  /** 今日から何日先まで予約を受け付けるか */
  horizonDays: number;
}
