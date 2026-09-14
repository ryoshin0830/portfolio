#!/usr/bin/env node
// Hero の名前だけを含む Noto Serif JP のサブセットを作る。
//
// なぜ必要か: Google Fonts の Noto Serif JP には japanese サブセットが無く
// (cyrillic / latin / latin-ext / vietnamese のみ)、next/font/google だと
// 漢字のスライスが preload されない。結果、名前が一瞬フォールバック明朝で
// 描かれてから差し替わっていた (FOUT)。2 文字だけの単一 @font-face にすれば
// preload 対象になり、初回ペイントの時点で確定する。
//
// 使い方: npm run build:hero-font
// messages/ja.json の名前を変えたら必ず実行して、生成物をコミットすること。
// (忘れると src/app/fonts/hero-font.test.ts が落ちる)

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
if (!codepoints) {
  throw new Error(`No unicode-range in the returned CSS:\n${css}`);
}

const expected = [...text]
  .map(
    (c) => `U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`,
  )
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
