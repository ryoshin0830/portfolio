/**
 * Hermes（自宅 Mac で常駐する NousResearch/hermes-agent）の OpenAI 互換 API
 * クライアント。**サーバー専用**（API キーは秘密、ブラウザに出さない）。
 * クライアントコンポーネントから import しないこと（API キーがバンドルに混入する）。
 *
 * 経路: Next.js(サーバー) ──HTTPS(Bearer)──▶ Cloudflare Tunnel ──▶ 自宅 Mac:Hermes
 *   - 自宅 Mac には公開 IP が無いため、Cloudflared 等で外向きトンネルを張り、
 *     固定の公開 URL（= HERMES_API_URL）を Hermes の内蔵 API サーバ（既定 :8642）
 *     に向ける。Next.js はその公開 URL を OpenAI 互換エンドポイントとして叩く。
 *   - カレンダーの読み取り / イベント作成は Hermes 側の Google Calendar ツールに
 *     任せる。したがってこのリポジトリは Google の資格情報を一切持たない。
 *
 * 必須 env:
 *   HERMES_API_URL  例 https://hermes.example.com（末尾スラッシュ不要、/v1 も不要）
 *   HERMES_API_KEY  Hermes 側 API_SERVER_KEY と一致する Bearer トークン
 * 任意 env:
 *   HERMES_MODEL    既定 "hermes"（`hermes model` で設定したモデル別名）
 */

export interface HermesMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Hermes が設定済みか（env が揃っているか）。未設定なら機能を gracefully に無効化する。 */
export function isHermesConfigured(): boolean {
  return Boolean(process.env.HERMES_API_URL && process.env.HERMES_API_KEY);
}

/** LLM/カレンダー往復のタイムアウト（ms）。ツール実行を挟むので長めに取る。 */
const HERMES_TIMEOUT_MS = 45_000;

/**
 * Hermes の /v1/chat/completions を 1 往復叩いて、アシスタントのテキストを返す。
 * 失敗（未設定・ネットワーク・非 2xx・タイムアウト）は例外を投げる。呼び出し側で
 * catch し、ユーザーには汎用エラーを見せること。
 */
export async function hermesChat(
  messages: HermesMessage[],
  opts: { temperature?: number } = {},
): Promise<string> {
  const base = process.env.HERMES_API_URL;
  const key = process.env.HERMES_API_KEY;
  if (!base || !key) {
    throw new Error("Hermes is not configured (HERMES_API_URL / HERMES_API_KEY)");
  }
  const model = process.env.HERMES_MODEL || "hermes";
  const url = `${base.replace(/\/$/, "")}/v1/chat/completions`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HERMES_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        // 日程調整は決定論寄りにしたいので温度は低め。
        temperature: opts.temperature ?? 0,
        messages,
      }),
      signal: controller.signal,
      // 予約・空き状況はリアルタイム性が要るのでキャッシュしない。
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Hermes responded ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim() === "") {
      throw new Error("Hermes returned an empty completion");
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * LLM の出力テキストから最初の JSON オブジェクトを抽出してパースする。
 * ```json フェンス、前後の散文、末尾の注釈などに耐えるよう防御的に処理する。
 */
export function extractJson<T>(text: string): T {
  // ```json ... ``` フェンスがあれば中身を優先。
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  // 最初の { から対応する } までを素朴に切り出す（ネスト対応の波括弧カウント）。
  const start = candidate.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in Hermes output");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const json = candidate.slice(start, i + 1);
        return JSON.parse(json) as T;
      }
    }
  }
  throw new Error("Unbalanced JSON object in Hermes output");
}
