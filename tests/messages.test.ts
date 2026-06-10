import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * messages/{ja,en,zh}.json のキー構造一致テスト。
 *
 * このサイトはすべてのコンテンツ（職歴・スキル・実績など構造化データ含む）を
 * 翻訳 JSON に格納しており、3 ファイルは同じキー構造（配列は同じ長さ）を
 * 保つ必要がある。片方だけにキーを足すと t.raw() のキャスト先で実行時に
 * 壊れるため、構造差をここで検出する。
 */

const MESSAGES_DIR = path.resolve(__dirname, "../messages");
const LOCALES = ["ja", "en", "zh"] as const;

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

function load(locale: string): Json {
  return JSON.parse(
    fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), "utf8")
  );
}

/** 構造を表すパスの集合（配列はインデックスまで含めて比較 = 長さも一致が必要） */
function structurePaths(value: Json, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return [
      `${prefix}:array(${value.length})`,
      ...value.flatMap((v, i) => structurePaths(v, `${prefix}[${i}]`)),
    ];
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) =>
      structurePaths(v, prefix ? `${prefix}.${k}` : k)
    );
  }
  return [`${prefix}:${typeof value}`];
}

describe("messages のキー構造", () => {
  const structures = new Map<string, Set<string>>(
    LOCALES.map((locale) => [locale, new Set(structurePaths(load(locale)))])
  );

  it.each([
    ["en", "ja"],
    ["zh", "ja"],
    ["ja", "en"],
    ["ja", "zh"],
  ])("%s.json に %s.json と同じ構造がある", (target, base) => {
    const baseSet = structures.get(base)!;
    const targetSet = structures.get(target)!;
    const missing = [...baseSet].filter((p) => !targetSet.has(p));
    expect(
      missing,
      `${base}.json にあって ${target}.json に無い構造:\n${missing.slice(0, 20).join("\n")}` +
        (missing.length > 20 ? `\n...他 ${missing.length - 20} 件` : "")
    ).toEqual([]);
  });
});
