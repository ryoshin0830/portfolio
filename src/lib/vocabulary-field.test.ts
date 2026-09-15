import { describe, expect, it } from "vitest";
import { TRIPLETS, layoutTriplet } from "./vocabulary-field";

describe("vocabulary-field", () => {
  it("すべての組が日中英そろっている", () => {
    for (const t of TRIPLETS) {
      expect(t.ja.length).toBeGreaterThan(0);
      expect(t.zh.length).toBeGreaterThan(0);
      expect(t.en.length).toBeGreaterThan(0);
    }
  });

  it("座標は 0..1 の割合に収まる", () => {
    for (const t of TRIPLETS) {
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.x).toBeLessThanOrEqual(1);
      expect(t.y).toBeGreaterThanOrEqual(0);
      expect(t.y).toBeLessThanOrEqual(1);
    }
  });

  it("左カラム（名前とタグライン）を避ける", () => {
    // 左側に置くと Hero の大きな名前組版と重なって可読性を削る
    for (const t of TRIPLETS) {
      expect(t.x).toBeGreaterThan(0.44);
    }
  });

  it("Hero 右下の事実リストの帯を避ける", () => {
    // 現職 / 学位 / 連絡先 がおおよそ x 0.66..0.96 × y 0.50..0.78 にある。
    // ここに語を置くと小さい文字の上に重なって読みにくくなる。
    const inFactList = TRIPLETS.filter(
      (t) => t.x > 0.66 && t.x < 0.96 && t.y > 0.5 && t.y < 0.78,
    );
    expect(inFactList).toEqual([]);
  });

  it("最下部の発信ティーザーの帯を避ける", () => {
    for (const t of TRIPLETS) {
      expect(t.y).toBeLessThan(0.8);
    }
  });

  it("実座標へ展開すると 3 語と 2 本のリンクになる", () => {
    const placed = layoutTriplet(TRIPLETS[0], 0, 1000, 800, 40);
    expect(placed.words).toHaveLength(3);
    expect(placed.links).toHaveLength(2);
    expect(placed.words.map((w) => w.lang)).toEqual(["ja", "zh", "en"]);
  });

  it("配置は決定的（SSR とクライアントで一致する）", () => {
    const a = layoutTriplet(TRIPLETS[2], 2, 1000, 800, 40);
    const b = layoutTriplet(TRIPLETS[2], 2, 1000, 800, 40);
    expect(a).toEqual(b);
  });

  it("組ごとに散らす角度を変える（機械的な整列にしない）", () => {
    const first = layoutTriplet(TRIPLETS[0], 0, 1000, 800, 40);
    const second = layoutTriplet(TRIPLETS[0], 1, 1000, 800, 40);
    // 同じ組でも index が違えば中国語の置き場所が変わる
    expect(second.words[1].x).not.toBeCloseTo(first.words[1].x, 3);
  });

  it("リンクは日本語を起点に他の 2 語へ引かれる", () => {
    const p = layoutTriplet(TRIPLETS[0], 0, 1000, 800, 40);
    const [ja, zh, en] = p.words;
    expect(p.links[0]).toEqual({ x1: ja.x, y1: ja.y, x2: zh.x, y2: zh.y });
    expect(p.links[1]).toEqual({ x1: ja.x, y1: ja.y, x2: en.x, y2: en.y });
  });
});
