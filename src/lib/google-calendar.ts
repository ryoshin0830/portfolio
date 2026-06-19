import { calendar, auth, type calendar_v3 } from "@googleapis/calendar";
import type { BusyInterval } from "@/types/scheduling";

/**
 * Google Calendar 直接アクセス（サーバー専用）。
 *
 * オーナー本人として実行する OAuth2 リフレッシュトークン方式（個人 Gmail でも招待メール＋Meet が
 * 動く唯一の方法）。Hermes/トンネルを廃し、Next.js サーバーから直接 API を叩く（サブ秒）。
 *
 * 必須 env: GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN
 * 任意 env: GOOGLE_CALENDAR_ID（既定 "primary"）
 *
 * ★セキュリティ: 外向きに渡してよいのは free/busy（busy 区間＝時刻のみ）と、予約結果だけ。
 *   予定のタイトル・参加者・説明は freebusy では返らないので構造的に漏れない。events.list は使わない。
 */

export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
      process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  );
}

export function getCalendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID || "primary";
}

let cached: calendar_v3.Calendar | null = null;

/** OAuth2(refresh token) 認証済みの Calendar クライアントを返す（トークンは自動更新・キャッシュ）。 */
function getClient(): calendar_v3.Calendar {
  if (cached) return cached;
  // @googleapis/calendar 同梱の auth(AuthPlus) を使う（google-auth-library のバージョン
  // 重複による型不一致を避けるため、トップレベルの別コピーは使わない）。
  const oauth2 = new auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  );
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });
  cached = calendar({ version: "v3", auth: oauth2 });
  return cached;
}

/**
 * 指定範囲の busy 区間を取得（freebusy.query）。返るのは start/end のみ＝予定の中身は含まれない。
 */
export async function fetchBusy(timeMinIso: string, timeMaxIso: string): Promise<BusyInterval[]> {
  const cal = getClient();
  const id = getCalendarId();
  const res = await cal.freebusy.query({
    requestBody: {
      timeMin: timeMinIso,
      timeMax: timeMaxIso,
      items: [{ id }],
    },
  });
  const busy = res.data.calendars?.[id]?.busy ?? [];
  return busy
    .filter((b): b is { start: string; end: string } => Boolean(b.start && b.end))
    .map((b) => ({ start: b.start, end: b.end }));
}

export interface CreatedEvent {
  htmlLink?: string;
  meetUrl?: string;
}

/**
 * イベントを作成（events.insert）。オーナー本人実行なので Meet 自動生成＋招待メール送信が効く。
 */
export async function insertEvent(args: {
  summary: string;
  startIso: string;
  endIso: string;
  timeZone: string;
  attendeeEmail: string;
  description?: string;
}): Promise<CreatedEvent> {
  const cal = getClient();
  const res = await cal.events.insert({
    calendarId: getCalendarId(),
    conferenceDataVersion: 1, // Meet 生成にはクエリパラメータで必須
    sendUpdates: "all", // 参加者へ招待メール送信
    requestBody: {
      summary: args.summary,
      description: args.description || undefined,
      start: { dateTime: args.startIso, timeZone: args.timeZone },
      end: { dateTime: args.endIso, timeZone: args.timeZone },
      attendees: [{ email: args.attendeeEmail }],
      conferenceData: {
        createRequest: {
          // 冪等キー（同じ requestId なら重複生成しない）。crypto はランタイム標準。
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });
  return {
    htmlLink: res.data.htmlLink ?? undefined,
    meetUrl: res.data.hangoutLink ?? undefined,
  };
}
