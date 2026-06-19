// Google OAuth2 refresh_token 取得スクリプト（一度きり）。
//
// 使い方:
//   node --env-file=.env.local scripts/mint-google-token.mjs
//   → ブラウザで同意 → 表示された refresh_token を .env.local の
//     GOOGLE_OAUTH_REFRESH_TOKEN= に貼る。
//
// 事前準備（Google Cloud Console → 認証情報 → 該当 OAuth クライアント）:
//   - 「承認済みのリダイレクト URI」に  http://localhost:5179  を追加（ウェブ アプリの場合）
//     ※「デスクトップ」タイプなら localhost は自動許可。
//   - OAuth 同意画面は「本番(Published)」に（テストのままだと refresh_token が7日で失効）。
//
// .env.local から CLIENT_ID / CLIENT_SECRET を読む（--env-file 経由）。秘密はスクリプトに書かない。

import http from "node:http";
import { OAuth2Client } from "google-auth-library";

const PORT = Number(process.env.MINT_PORT || 5179);
const REDIRECT = `http://localhost:${PORT}`;
const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("✗ GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET が未設定です。");
  console.error("  実行例: node --env-file=.env.local scripts/mint-google-token.mjs");
  process.exit(1);
}

const oauth2 = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT);
const authUrl = oauth2.generateAuthUrl({
  access_type: "offline", // refresh_token を得るために必須
  prompt: "consent", // 毎回 refresh_token を確実に返させる
  scope: SCOPES,
});

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, REDIRECT);
    const code = url.searchParams.get("code");
    if (!code) {
      res.writeHead(400).end("no code");
      return;
    }
    const { tokens } = await oauth2.getToken(code);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h2>✅ 取得できました。ターミナルに戻ってください。このタブは閉じてOKです。</h2>");
    console.log("\n================ REFRESH TOKEN ================");
    if (tokens.refresh_token) {
      console.log(tokens.refresh_token);
      console.log("\n→ .env.local の GOOGLE_OAUTH_REFRESH_TOKEN= に貼ってください。");
    } else {
      console.log("✗ refresh_token が返りませんでした。");
      console.log("  既に同意済みの可能性。Googleアカウントの『サードパーティのアクセス』から");
      console.log("  当該アプリを一度削除してから再実行するか、prompt=consent で再試行してください。");
    }
    console.log("===============================================\n");
    server.close();
    process.exit(0);
  } catch (e) {
    res.writeHead(500).end("error: " + (e?.message || e));
    console.error("✗ トークン交換に失敗:", e?.message || e);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`\nリダイレクト URI: ${REDIRECT}  （OAuthクライアントに登録されている必要があります）`);
  console.log("\n↓ このURLをブラウザで開いて同意してください:\n");
  console.log(authUrl + "\n");
});
