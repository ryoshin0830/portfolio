# Hero の名前「梁 震」のフォント差し替わり（FOUT）を消す

- 日付: 2026-09-14
- 対象: `src/app/[locale]/layout.tsx` の Noto Serif JP 読み込み

## 症状

サイトを開くと Hero の名前「梁 震」が一瞬別のフォント（明朝）で描画され、
そのあと Noto Serif JP Black に切り替わる。

## 原因調査（実施済み）

本番 `https://www.ryosh.in/ja` の配信物と Playwright での実測で確定させた。

### 1. Noto Serif JP には `japanese` サブセットが存在しない

next/font が持つ Google Fonts メタデータ上、Noto Serif JP / Noto Sans JP で
指定できるサブセットは以下だけ。

```
cyrillic, latin, latin-ext, vietnamese
```

`layout.tsx` の `subsets: ["latin"]` は「これしか選べない」ので指定自体は正しいが、
結果として **preload 対象は latin スライスのみ**になる。

### 2. 名前 2 文字は preload されない別々のスライスに入っている

配信 CSS を全件パースした結果:

| 項目 | 実測 |
|---|---|
| Noto Serif JP の `@font-face` 総数 | 124 |
| うち preload されるもの | 1（latin のみ、ファイル名 `-s.p.woff2`） |
| 「梁」U+6881 | `f1bcfe23c95326dc-s.woff2` 14,480 B・preload なし |
| 「震」U+9707 | `7cba7a7a1ce422e8-s.woff2` 12,596 B・preload なし |

名前 2 文字が別スライスなので、2 ファイル揃うまで表示が確定しない。

### 3. リクエストの順序（Playwright 実測）

| 事象 | 時刻 |
|---|---|
| preload された 4 本（各フォントの latin） | 377 ms |
| preload されない 49 本 | 404–405 ms |
| first-contentful-paint | 744 ms |

preload されない 49 本は「CSS 適用後、このグリフが要ると分かってから」初めて
要求される。FCP 時点で名前はフォールバックで描かれ、あとから swap される。
Serif の 2 本は 49 本の**最後尾**に並ぶ（Noto Sans JP の日本語スライス 47 本が先行）。

### 4. 切り替わりが目立つ理由

next/font が自動生成したフォールバック face は漢字を持たない:

```css
@font-face{font-family:"Noto Serif JP Fallback";src:local("Times New Roman");
  ascent-override:95.04%;descent-override:23.62%;line-gap-override:0.00%;size-adjust:121.11%}
```

Times New Roman に「梁」「震」がないため、実際の初期描画は
`globals.css` のスタックの先にある **Hiragino Mincho ProN** に落ちる。
ここにはメトリクス補正が一切効かず、Hiragino に Black ウェイトもないため、
最終的な Noto Serif JP Black とは字形も太さも大きく異なる。

漢字は全フォント共通で全角送りのため幅は一致する（実測 332.8 px で同値）。
つまり **CLS は出ず、字だけが変わる** — 報告された見え方と一致する。

## 採らない案

| 案 | 却下理由 |
|---|---|
| `next/font/google` の `text` オプション | Next.js 15.5.9 は未対応（`validate-google-font-function-call.js` に受け口がない） |
| 生成された 2 スライスを手動 `<link rel=preload>` | ハッシュ名がビルドごとに変わるため壊れる |
| `display: "optional"` | 切り替わりは消えるが初回訪問でほぼ明朝が出ない。ブランドマークとして後退 |
| `display: "block"` | 最大 3 秒名前が不可視。LCP 悪化 |
| セリフをやめる | デザイン方針（唯一のセリフ = ブランドマーク）の後退 |

## 設計

「梁震」2 文字だけのサブセット woff2 をリポジトリに持ち、`next/font/local` で読む。
unicode-range で分割されない単一ファイルになるため preload 対象に昇格し、
HTML と同時に取得されて FCP 前に確定する。実測サイズは **1,560 B**。

### フォント資産

| ファイル | 内容 |
|---|---|
| `src/app/fonts/noto-serif-jp-hero-900.woff2` | 「梁」「震」のみ・weight 900・1,560 B |
| `src/app/fonts/hero-font.json` | マニフェスト（`text` / `codepoints` / `bytes` / `family` / `weight` / `source`） |
| `src/app/fonts/LICENSE-OFL.txt` | SIL OFL 1.1（Noto Serif JP のライセンス） |
| `scripts/build-hero-font.mjs` | 再取得スクリプト（Node 標準のみ、追加依存なし） |

### 生成スクリプトの契約

1. `messages/ja.json` の `names.japanese` を読み、空白を除いて対象文字列を決める
   （文字列をスクリプト内にハードコードしない = 名前とフォントが構造的にずれない）
2. `https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@900&text=<対象>&display=swap`
   を Chrome の User-Agent で取得する（UA を偽らないと woff2 ではなく ttf が返る）
3. 返ってきた CSS の `unicode-range` を**そのまま**マニフェストに記録する。
   これが「このファイルに何が入っているか」の権威ある情報源になる
4. `url(...)` の woff2 を取得して `noto-serif-jp-hero-900.woff2` に保存し、
   実バイト数を `bytes` に記録する
5. 内容が既存と同一なら `unchanged` と表示して終了する（差分ノイズを出さない）

### `src/app/[locale]/layout.tsx`

`Noto_Serif_JP`（next/font/google）を削除し、`next/font/local` に差し替える。

```ts
const notoSerifJPHero = localFont({
  src: "../fonts/noto-serif-jp-hero-900.woff2",
  variable: "--font-noto-serif-jp",
  weight: "900",
  display: "swap",           // preload されるので実質発火しない
  adjustFontFallback: false, // Times New Roman 補正は漢字に無意味（原因 4 の元凶）
  fallback: ["Hiragino Mincho ProN", "Yu Mincho", "Georgia", "serif"],
  declarations: [{ prop: "unicode-range", value: "U+6881, U+9707" }],
});
```

CSS 変数名 `--font-noto-serif-jp` は据え置くため `globals.css:91` の
`--font-display-serif` スタックは変更しない。
`<html>` の className に渡す変数リストも変数名が同じなので変更しない。

`declarations` の unicode-range はマニフェストの `codepoints` と一致させる。
グリフ単位のフォールバックがあるため機能上は必須ではないが、
「このフォントは 2 グリフしか持たない」を宣言として残す。

### 回帰テスト `src/app/fonts/hero-font.test.ts`

`src/lib/sections.test.ts` と同じ「静的整合性テスト」の方針。

1. `messages/{ja,en,zh}.json` の `names.japanese` の全コードポイントが
   マニフェストの `codepoints` に含まれること
2. マニフェストの `bytes` が実 woff2 のバイト数と一致すること
   （マニフェストと実体の紐付け）
3. `layout.tsx` の `declarations` の unicode-range がマニフェストと一致すること

名前を変えたのにフォントを作り直していない、という事故を pre-commit で検出する。

## 検証

- `npm run build && npm run typecheck && npm run lint && npm run test`
- 本番ビルド（`npm run start`）を Playwright で開いて実測する
  - `<link rel="preload" as="font">` にヒーローフォントが載る
  - `document.fonts.check('900 160px <family>', '梁震')` が FCP 前に true
  - 配信 CSS から Noto Serif JP の 124 個の `@font-face` が消えている

## 副次効果

- 配信 CSS から Noto Serif JP の `@font-face` 124 個が消える
- 遅延取得されるフォントスライスが 49 本 → 47 本になり、Serif が行列から抜ける

## 対象外

Noto Sans JP の日本語スライス 47 本（合計 700–900 KB 規模）が遅延取得される件は
本 PR では扱わない。Hero の名前とは別の問題であり、本文全体のグリフが対象になるため
同じ手法（全文サブセット化）は使えない。
