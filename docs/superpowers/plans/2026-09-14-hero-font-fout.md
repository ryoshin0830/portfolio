# Hero フォント FOUT 解消 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hero の名前「梁 震」が読み込み時に別フォントから切り替わる現象を、2 文字だけのサブセット woff2 を preload させることで消す。

**Architecture:** `next/font/google` の `Noto_Serif_JP` をやめ、「梁震」2 文字だけを含む 1,560 B の woff2 をリポジトリに持って `next/font/local` で読む。unicode-range で分割されない単一 `@font-face` になるため next/font の preload 対象に昇格し、HTML と同時に取得されて FCP 前に確定する。フォントは `scripts/build-hero-font.mjs` が `messages/ja.json` の名前から生成し、`hero-font.json` マニフェストに実際の収録コードポイントを記録する。

**Tech Stack:** Next.js 15.5.9 / `next/font/local` / Node 標準 API のみ（追加依存なし） / Vitest

**Spec:** `docs/superpowers/specs/2026-09-14-hero-font-fout-design.md`

## Global Constraints

- 追加の npm 依存を入れない。生成スクリプトは Node 標準の `fetch` / `node:fs` / `node:path` だけで書く。
- Google Fonts CSS の取得には Chrome の User-Agent を送る。送らないと woff2 ではなく ttf の URL が返る。
  UA 文字列: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36`
- 対象文字列をスクリプト内にハードコードしない。`messages/ja.json` の `names.japanese` から空白を除いて導出する。
- CSS 変数名 `--font-noto-serif-jp` は変更しない（`src/app/globals.css:91` の `--font-display-serif` が参照している）。
- コードポイントの表記は Google Fonts が返す形式 `U+6881, U+9707`（大文字 4 桁ゼロ埋め、`, ` 区切り）に統一する。
- 既存のコメントは日本語。追加するコメントも日本語で、「なぜ」を書く（CLAUDE.md の既存コードの流儀）。

---

### Task 1: サブセットフォントの生成スクリプトと資産

「梁震」だけを含む woff2、その収録内容を記録したマニフェスト、再生成スクリプト、ライセンスを追加する。
まず「マニフェストと実体が名前と整合していること」を検証する失敗するテストを書き、それを通す形で資産を生成する。

**Files:**
- Create: `scripts/build-hero-font.mjs`
- Create: `src/app/fonts/noto-serif-jp-hero-900.woff2`（スクリプトが生成）
- Create: `src/app/fonts/hero-font.json`（スクリプトが生成）
- Create: `src/app/fonts/LICENSE-OFL.txt`
- Test: `src/app/fonts/hero-font.test.ts`

**Interfaces:**
- Consumes: `messages/{ja,en,zh}.json` の `names.japanese`
- Produces:
  - `src/app/fonts/hero-font.json` — 形:
    ```json
    {
      "family": "Noto Serif JP",
      "weight": "900",
      "text": "梁震",
      "codepoints": "U+6881, U+9707",
      "bytes": 1560,
      "file": "noto-serif-jp-hero-900.woff2",
      "source": "https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@900&text=%E6%A2%81%E9%9C%87&display=swap"
    }
    ```
  - `npm run build:hero-font` — 再生成コマンド（Task 1 Step 7 で `package.json` に追加）
  - Task 2 は `hero-font.json` の `codepoints` を `layout.tsx` の `unicode-range` と突き合わせる

- [ ] **Step 1: 失敗するテストを書く**

`src/app/fonts/hero-font.test.ts` を作る。

```ts
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import heroFont from "./hero-font.json";

import ja from "../../../messages/ja.json";
import en from "../../../messages/en.json";
import zh from "../../../messages/zh.json";

const FONTS_DIR = path.join(process.cwd(), "src/app/fonts");

/** "U+6881, U+9707" -> Set { 0x6881, 0x9707 } */
function parseCodepoints(spec: string): Set<number> {
  return new Set(
    spec.split(",").map((token) => {
      const match = /^U\+([0-9A-F]{4,6})$/.exec(token.trim());
      if (!match) throw new Error(`Unparsable codepoint: ${token}`);
      return parseInt(match[1], 16);
    }),
  );
}

describe("hero subset font", () => {
  // 名前を messages で変えたのにフォントを作り直していない、を検出する。
  // 落ちたら `npm run build:hero-font` を実行してコミットする。
  it.each([
    ["ja", ja],
    ["en", en],
    ["zh", zh],
  ])("covers every glyph of the %s hero name", (_locale, messages) => {
    const covered = parseCodepoints(heroFont.codepoints);
    const name = messages.names.japanese.replace(/\s+/gu, "");

    for (const char of name) {
      expect(
        covered.has(char.codePointAt(0)!),
        `"${char}" is not in ${heroFont.file}`,
      ).toBe(true);
    }
  });

  // マニフェストと実ファイルの紐付け。片方だけ差し替わった状態を弾く。
  it("records the real byte size of the woff2", () => {
    expect(statSync(path.join(FONTS_DIR, heroFont.file)).size).toBe(
      heroFont.bytes,
    );
  });

  it("ships a woff2, not a ttf renamed to woff2", () => {
    const magic = readFileSync(path.join(FONTS_DIR, heroFont.file)).subarray(
      0,
      4,
    );
    expect(magic.toString("ascii")).toBe("wOF2");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/app/fonts/hero-font.test.ts`
Expected: FAIL — `Failed to resolve import "./hero-font.json"`（資産がまだ無い）

- [ ] **Step 3: 生成スクリプトを書く**

`scripts/build-hero-font.mjs` を作る。

```js
#!/usr/bin/env node
// Hero の名前だけを含む Noto Serif JP のサブセットを作る。
//
// なぜ必要か: Google Fonts の Noto Serif JP には japanese サブセットが無く
// (cyrillic / latin / latin-ext / vietnamese のみ)、next/font/google だと
// 漢字のスライスが preload されない。結果、名前が一瞬フォールバック明朝で
// 描かれてから差し替わる (FOUT)。2 文字だけの単一 @font-face にすれば
// preload 対象になり、初回ペイントの時点で確定する。
//
// 使い方: npm run build:hero-font
// messages/ja.json の名前を変えたら必ず実行して、生成物をコミットすること。

import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONTS_DIR = path.join(ROOT, "src/app/fonts");
const FILE_NAME = "noto-serif-jp-hero-900.woff2";

const FAMILY = "Noto Serif JP";
const WEIGHT = "900";

// UA を偽らないと Google Fonts は woff2 ではなく ttf の URL を返す。
const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function get(url) {
  const res = await fetch(url, { headers: { "user-agent": CHROME_UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res;
}

// 対象文字はハードコードせず翻訳ファイルから引く。名前とフォントがずれない。
const name = JSON.parse(
  readFileSync(path.join(ROOT, "messages/ja.json"), "utf8"),
).names.japanese;
const text = name.replace(/\s+/gu, "");
if (!text) throw new Error("names.japanese is empty in messages/ja.json");

const cssUrl =
  `https://fonts.googleapis.com/css2?family=${FAMILY.replace(/ /g, "+")}` +
  `:wght@${WEIGHT}&text=${encodeURIComponent(text)}&display=swap`;

const css = await (await get(cssUrl)).text();

const fontUrl = /src:\s*url\((https:\/\/[^)]+)\)\s*format\('woff2'\)/.exec(
  css,
)?.[1];
if (!fontUrl) throw new Error(`No woff2 url in the returned CSS:\n${css}`);

// Google が返す unicode-range が「このファイルに何が入っているか」の正。
const codepoints = /unicode-range:\s*([^;]+);/.exec(css)?.[1].trim();
if (!codepoints) throw new Error(`No unicode-range in the returned CSS:\n${css}`);

const expected = [...text]
  .map((c) => `U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`)
  .join(", ");
if (codepoints !== expected) {
  throw new Error(
    `Google returned "${codepoints}" but "${text}" needs "${expected}"`,
  );
}

const buffer = Buffer.from(await (await get(fontUrl)).arrayBuffer());
if (buffer.subarray(0, 4).toString("ascii") !== "wOF2") {
  throw new Error("Downloaded file is not woff2");
}

mkdirSync(FONTS_DIR, { recursive: true });
const fontPath = path.join(FONTS_DIR, FILE_NAME);

let unchanged = false;
try {
  unchanged = readFileSync(fontPath).equals(buffer);
} catch {
  // 初回生成。差分ノイズの判定は不要。
}

writeFileSync(fontPath, buffer);
writeFileSync(
  path.join(FONTS_DIR, "hero-font.json"),
  JSON.stringify(
    {
      family: FAMILY,
      weight: WEIGHT,
      text,
      codepoints,
      bytes: statSync(fontPath).size,
      file: FILE_NAME,
      source: cssUrl,
    },
    null,
    2,
  ) + "\n",
);

console.log(
  `${FILE_NAME}: ${buffer.length} B for "${text}" (${codepoints})` +
    (unchanged ? " -> unchanged" : " -> written"),
);
```

- [ ] **Step 4: `package.json` にコマンドを足す**

`scripts` に 1 行追加する（`lint:fix` の下）。

```json
"build:hero-font": "node scripts/build-hero-font.mjs",
```

- [ ] **Step 5: スクリプトを実行して資産を生成する**

Run: `npm run build:hero-font`
Expected: `noto-serif-jp-hero-900.woff2: 1560 B for "梁震" (U+6881, U+9707) -> written`

- [ ] **Step 6: ライセンスを置く**

Noto Serif JP は SIL OFL 1.1。配布物に同梱するので原文を置く。

```bash
curl -sL https://raw.githubusercontent.com/notofonts/noto-cjk/main/Serif/LICENSE \
  -o src/app/fonts/LICENSE-OFL.txt
```

Expected: 4,301 B のファイルができ、`head -1` が `Copyright 2014-2021 Adobe (http://www.adobe.com/)`

- [ ] **Step 7: テストが通ることを確認する**

Run: `npx vitest run src/app/fonts/hero-font.test.ts`
Expected: PASS（3 テスト、`covers every glyph` は ja/en/zh の 3 ケース）

- [ ] **Step 8: コミットする**

```bash
git add scripts/build-hero-font.mjs package.json src/app/fonts/
git commit -m "feat(font): Hero の名前だけを含む Noto Serif JP サブセットを追加する"
```

---

### Task 2: `next/font/local` への差し替え

`Noto_Serif_JP`（next/font/google）を Task 1 のサブセットに置き換える。
これが FOUT を実際に消す変更。

**Files:**
- Modify: `src/app/[locale]/layout.tsx:2`（import 行）
- Modify: `src/app/[locale]/layout.tsx:31-38`（フォント定義）
- Test: `src/app/fonts/hero-font.test.ts`（追記）

**Interfaces:**
- Consumes: Task 1 の `src/app/fonts/noto-serif-jp-hero-900.woff2` と `hero-font.json`
- Produces: CSS 変数 `--font-noto-serif-jp`（変数名は変更なし。`globals.css:91` の
  `--font-display-serif` がこれを参照し続ける）

- [ ] **Step 1: 失敗するテストを書く**

`src/app/fonts/hero-font.test.ts` の `describe` ブロックの末尾に追記する。
`src/lib/sections.test.ts` と同じソース走査の静的テスト。

```ts
  // layout.tsx の unicode-range とマニフェストのずれを弾く。
  // 併せて next/font/google の Noto_Serif_JP に戻っていないことも見る
  // (戻すと漢字スライスが preload されず FOUT が再発する)。
  it("is wired into layout.tsx with a matching unicode-range", () => {
    const layout = readFileSync(
      path.join(process.cwd(), "src/app/[locale]/layout.tsx"),
      "utf8",
    );

    expect(layout).not.toMatch(/Noto_Serif_JP/);
    expect(layout).toContain(`../fonts/${heroFont.file}`);
    expect(layout).toContain(`value: "${heroFont.codepoints}"`);
  });
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/app/fonts/hero-font.test.ts`
Expected: FAIL — `expected '…Noto_Serif_JP…' not to match /Noto_Serif_JP/`

- [ ] **Step 3: import 行を差し替える**

`src/app/[locale]/layout.tsx:2` を書き換え、`localFont` の import を足す。

変更前:
```ts
import { Inter, JetBrains_Mono, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
```

変更後:
```ts
import { Inter, JetBrains_Mono, Noto_Sans_JP } from "next/font/google";
import localFont from "next/font/local";
```

- [ ] **Step 4: フォント定義を差し替える**

`src/app/[locale]/layout.tsx:31-38` の以下のブロック

```ts
// Hero の名前専用のディスプレイ明朝（Black のみ — 細いウェイトの明朝は超大型
// サイズで貧弱に見える）。日本語フォントは next/font が unicode-range でスライス
// 配信するため、使用グリフ分しかダウンロードされない。
const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  variable: "--font-noto-serif-jp",
  display: "swap",
  weight: ["900"],
});
```

を、こう置き換える。

```ts
// Hero の名前専用のディスプレイ明朝（Black のみ — 細いウェイトの明朝は超大型
// サイズで貧弱に見える）。
//
// next/font/google は使わない: Google Fonts の Noto Serif JP には japanese
// サブセットが無く、preload できるのは latin スライスだけ。漢字のスライスは
// CSS 適用後にしか要求されないため、名前が一瞬フォールバック明朝で描かれてから
// 差し替わっていた。「梁震」2 文字だけの単一 @font-face なら preload 対象に
// なり、初回ペイントで確定する。
// 生成: npm run build:hero-font（詳細は scripts/build-hero-font.mjs）
const notoSerifJP = localFont({
  src: "../fonts/noto-serif-jp-hero-900.woff2",
  variable: "--font-noto-serif-jp",
  weight: "900",
  style: "normal",
  display: "swap",
  // 自動生成されるメトリクス補正フォールバックは local("Times New Roman") に
  // なり漢字を 1 文字も持たない。補正が効かないうえ、この @font-face 自体が
  // 誤解を招くので切る。実フォールバックは globals.css の --font-display-serif。
  adjustFontFallback: false,
  fallback: ["Hiragino Mincho ProN", "Yu Mincho", "Georgia", "serif"],
  // このファイルは 2 グリフしか持たないことを宣言として残す。
  declarations: [{ prop: "unicode-range", value: "U+6881, U+9707" }],
});
```

変数名 `notoSerifJP` は据え置くので `layout.tsx:130` の className は変更不要。

- [ ] **Step 5: テストが通ることを確認する**

Run: `npx vitest run src/app/fonts/hero-font.test.ts`
Expected: PASS（4 テスト）

- [ ] **Step 6: 型検査と lint を通す**

Run: `npm run typecheck && npm run lint`
Expected: 両方ともエラーなし

- [ ] **Step 7: コミットする**

```bash
git add "src/app/[locale]/layout.tsx" src/app/fonts/hero-font.test.ts
git commit -m "fix(font): Hero の名前を preload される 2 文字サブセットで描く"
```

---

### Task 3: 本番ビルドでの実測検証

FOUT が実際に消えたことと、退行が無いことをブラウザで確かめる。コード変更は無く、
問題が見つかったら Task 1 / Task 2 に差し戻す判断をするゲート。

**Files:**
- Modify: なし（検証のみ。問題があれば該当タスクに戻る）

**Interfaces:**
- Consumes: Task 2 完了後の作業ツリー

- [ ] **Step 1: フルゲートを回す**

Run: `npm run build && npm run typecheck && npm run lint && npm run test`
Expected: すべて成功。`npm run build` の警告に `next/font` 関連が出ないこと。

- [ ] **Step 2: 本番サーバーを起動する**

Run: `npm run start`（バックグラウンド、`http://localhost:3000`）

- [ ] **Step 3: preload に載っていることを確認する**

```bash
curl -sL http://localhost:3000/ja | grep -o '<link rel="preload"[^>]*as="font"[^>]*>'
```

Expected: 5 本になる（従来の 4 本 + ヒーローフォント 1 本）。
ヒーローフォントのファイルが `.next/static/media/` にあり、サイズが 1,560 B であること。

- [ ] **Step 4: 配信 CSS から Noto Serif JP の 124 スライスが消えたことを確認する**

```bash
curl -sL http://localhost:3000/ja \
  | grep -o '/_next/static/css/[^"?]*\.css' | sort -u \
  | while read -r p; do curl -s "http://localhost:3000$p"; done \
  | grep -c 'Noto Serif JP'
```

Expected: 0（従来は `@font-face` が 124 個 + Fallback 1 個あった）。
生成された `@font-face` の font-family は next/font の自動生成名になる。

- [ ] **Step 5: ブラウザで実測する**

Playwright MCP で `http://localhost:3000/ja` を開き、以下を評価する。

```js
() => {
  const h1 = document.querySelector('h1');
  const family = getComputedStyle(h1).fontFamily.split(',')[0].trim();
  const fonts = performance.getEntriesByType('resource')
    .filter(r => r.name.endsWith('.woff2'))
    .map(r => ({ file: r.name.split('/').pop(), start: Math.round(r.startTime) }))
    .sort((a, b) => a.start - b.start);
  return {
    family,
    ready: document.fonts.check(`900 160px ${family}`, '梁震'),
    fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0].startTime),
    firstFive: fonts.slice(0, 5),
  };
}
```

Expected:
- `ready` が `true`
- ヒーローフォントが `firstFive` に入り、その `start` が preload された他フォントと同じ時刻帯（FCP より十分前）
- 名前の描画に使われるファミリが next/font の自動生成名（Hiragino ではない）

- [ ] **Step 6: 結果を記録してサーバーを止める**

計測値（preload 本数、`ready`、FCP、フォント取得時刻）を PR 本文に載せるためメモする。
`npm run start` のプロセスを終了する。

---

## Self-Review

**1. Spec coverage**

| Spec の要求 | 対応タスク |
|---|---|
| サブセット woff2 をリポジトリに持つ | Task 1 Step 5 |
| マニフェスト `hero-font.json` | Task 1 Step 3（スクリプトが生成）|
| OFL ライセンス同梱 | Task 1 Step 6 |
| 生成スクリプト（Node 標準のみ、文字列は messages 由来）| Task 1 Step 3 |
| `next/font/local` への差し替え（`adjustFontFallback: false` 等）| Task 2 Step 4 |
| CSS 変数名・`globals.css` を変えない | Task 2 Step 4（変数名据え置きを明記）|
| 回帰テスト 1: 名前のコードポイント ⊆ マニフェスト | Task 1 Step 1 |
| 回帰テスト 2: マニフェストの bytes = 実ファイル | Task 1 Step 1 |
| 回帰テスト 3: layout.tsx の unicode-range = マニフェスト | Task 2 Step 1 |
| build / typecheck / lint / test | Task 3 Step 1 |
| ブラウザ実測（preload・`fonts.check`・124 @font-face 消失）| Task 3 Step 3–5 |

漏れなし。

**2. Placeholder scan**

「TBD」「適切に」「同様に」の類は無し。全コードブロックが実コード。
Task 1 Step 3 のスクリプトと Task 3 Step 5 の評価コードは実行して動作確認済み。

**3. Type consistency**

- マニフェストのキー（`family` / `weight` / `text` / `codepoints` / `bytes` / `file` / `source`）は
  Task 1 の Interfaces、スクリプトの `writeFileSync`、Task 1 のテスト、Task 2 のテストで一致。
- `heroFont.file` / `heroFont.codepoints` / `heroFont.bytes` のみをテストから参照している。
- フォント定数名は Task 2 の前後で `notoSerifJP` のまま（`layout.tsx:130` の className を触らずに済む）。
- `codepoints` の表記 `U+6881, U+9707` は、Google の返り値・スクリプトの検算・`declarations` の
  `value`・テストの `toContain` で同一文字列。
