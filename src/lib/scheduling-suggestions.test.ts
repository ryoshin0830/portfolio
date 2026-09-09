import { describe, expect, it } from "vitest";
import { parseSuggestions } from "./scheduling-suggestions";

/**
 * エージェントは応答の最終行に `SUGGEST: a | b | c` を出す。旧実装は Tailwind 付きの
 * <a href="action:suggest"> を毎ターン ~700 トークンぶん生成させていたが、これは
 * ~25 トークンで済み、しかも文脈に応じた内容になる。
 *
 * 本文からは必ず除去する。ストリーミング中は行が途中まで届くので、マーカーの
 * 「途中の状態」も本文に出さない（チップ自体は非ストリーミング時のみ描画するため、
 * 途中の items が揺れるのは画面に出ない）。
 */

describe("parseSuggestions", () => {
  it("マーカーが無ければ本文をそのまま返す", () => {
    const text = "候補はこちらです。\n\n- 9/9 (水) 10:00 - 11:00";
    expect(parseSuggestions(text)).toEqual({ text, suggestions: [] });
  });

  it("完成したマーカー行を本文から除去して項目を取り出す", () => {
    const result = parseSuggestions(
      "候補はこちらです。\nSUGGEST: 30分で十分 | 夜の枠がいい | 来週で探して",
    );

    expect(result.text).toBe("候補はこちらです。");
    expect(result.suggestions).toEqual(["30分で十分", "夜の枠がいい", "来週で探して"]);
  });

  it("全角コロンでも拾う", () => {
    const result = parseSuggestions("本文\nSUGGEST： 朝がいい | 夜がいい");
    expect(result.text).toBe("本文");
    expect(result.suggestions).toEqual(["朝がいい", "夜がいい"]);
  });

  it("項目の前後の空白を落とし、空の項目は捨てる", () => {
    const result = parseSuggestions("本文\nSUGGEST:   a   |  | b |   ");
    expect(result.suggestions).toEqual(["a", "b"]);
  });

  it("項目は 4 件までに制限する", () => {
    const result = parseSuggestions("本文\nSUGGEST: a | b | c | d | e | f");
    expect(result.suggestions).toEqual(["a", "b", "c", "d"]);
  });

  it("ストリーミング途中の部分マーカーを本文に出さない", () => {
    expect(parseSuggestions("本文です。\nS").text).toBe("本文です。");
    expect(parseSuggestions("本文です。\nSUG").text).toBe("本文です。");
    expect(parseSuggestions("本文です。\nSUGGEST").text).toBe("本文です。");
    expect(parseSuggestions("本文です。\nSUGGEST:").text).toBe("本文です。");
  });

  it("部分マーカーの段階では項目を出さない", () => {
    expect(parseSuggestions("本文です。\nSUGGEST").suggestions).toEqual([]);
  });

  it("項目が届き始めた段階ではそこまでの項目を返す", () => {
    const result = parseSuggestions("本文です。\nSUGGEST: 30分で十分 | 夜の");
    expect(result.text).toBe("本文です。");
    expect(result.suggestions).toEqual(["30分で十分", "夜の"]);
  });

  it("マーカーの綴りでない行は本文として残す", () => {
    expect(parseSuggestions("本文です。\nSorry, 空きがありません。").text).toBe(
      "本文です。\nSorry, 空きがありません。",
    );
    expect(parseSuggestions("本文です。\nSUGGESTION というのは").text).toBe(
      "本文です。\nSUGGESTION というのは",
    );
  });

  it("マーカーが途中の行にあってもその行だけを除去し、後続の本文は残す", () => {
    const result = parseSuggestions("前半\nSUGGEST: a | b\n後半の本文");
    expect(result.text).toBe("前半\n後半の本文");
    expect(result.suggestions).toEqual(["a", "b"]);
  });

  it("マーカーだけの応答でも壊れない", () => {
    const result = parseSuggestions("SUGGEST: a | b");
    expect(result.text).toBe("");
    expect(result.suggestions).toEqual(["a", "b"]);
  });
});
