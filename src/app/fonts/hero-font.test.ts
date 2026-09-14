import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import heroFont from "./hero-font.json";

/**
 * Hero の名前専用サブセットフォントの整合性テスト。
 *
 * このフォントは「梁震」の 2 グリフしか持たない。Google Fonts の
 * Noto Serif JP に japanese サブセットが無く、next/font/google では漢字の
 * スライスが preload されないため（名前が一瞬フォールバック明朝で描かれてから
 * 差し替わる）、2 文字だけの単一 @font-face にして preload させている。
 *
 * 収録グリフが名前から外れると豆腐やフォント不一致になるが、ビルドは通って
 * しまう。src/lib/sections.test.ts と同じ静的整合性テストで commit 前に弾く。
 */

const ROOT = process.cwd();
const FONTS_DIR = path.join(ROOT, "src/app/fonts");

type Messages = { names: { japanese: string } };

function heroName(locale: string): string {
  const messages = JSON.parse(
    readFileSync(path.join(ROOT, "messages", `${locale}.json`), "utf8"),
  ) as Messages;
  return messages.names.japanese.replace(/\s+/gu, "");
}

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
  // 落ちたら `npm run build:hero-font` を実行して生成物をコミットする。
  it.each(["ja", "en", "zh"])(
    "covers every glyph of the %s hero name",
    (locale) => {
      const covered = parseCodepoints(heroFont.codepoints);

      for (const char of heroName(locale)) {
        expect(
          covered.has(char.codePointAt(0)!),
          `"${char}" is not in ${heroFont.file}`,
        ).toBe(true);
      }
    },
  );

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
