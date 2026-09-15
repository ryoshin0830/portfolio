import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * ScrollMotionRoot が持つ「横断セレクタ」を、他のコンポーネントが二重に
 * 登録していないことを検証する静的テスト。
 *
 * 実際に起きたバグ: AboutSection が自前で gsap.from("[data-reveal]") を
 * 登録しており、ScrollMotionRoot の同名セレクタと合わせて 1 要素に 2 本の
 * from トゥイーンが掛かった。from は生成時に「開始状態」(opacity: 0) を
 * 即座に適用するため、2 本が競合してプロフィール本文が opacity: 0 のまま
 * 表示されなくなった。
 */

const SHARED_SELECTORS = [
  "[data-reveal]",
  "[data-reveal-head]",
  "[data-stagger]",
  "[data-magnetic]",
  ".tilt-card",
];

const OWNER = join("src", "components", "motion", "ScrollMotionRoot.tsx");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return full.endsWith(".tsx") || full.endsWith(".ts") ? [full] : [];
  });
}

describe("ScrollMotionRoot が横断セレクタの唯一の持ち主である", () => {
  const files = walk("src").filter(
    (f) => f !== OWNER && !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"),
  );

  for (const selector of SHARED_SELECTORS) {
    it(`${selector} を GSAP に渡すのは ScrollMotionRoot だけ`, () => {
      const offenders = files.filter((f) => {
        const src = readFileSync(f, "utf8");
        // JSX の属性付与（data-reveal など）ではなく、
        // GSAP へ「セレクタ文字列として」渡している箇所だけを検出する。
        return src.includes(`"${selector}"`) || src.includes(`'${selector}'`);
      });
      expect(offenders).toEqual([]);
    });
  }
});
