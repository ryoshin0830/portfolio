import { describe, expect, it } from "vitest";

describe("src/lib/gsap", () => {
  it("gsap と ScrollTrigger と useGSAP を re-export する", async () => {
    const mod = await import("./gsap");
    expect(typeof mod.gsap.to).toBe("function");
    expect(typeof mod.ScrollTrigger.refresh).toBe("function");
    expect(typeof mod.useGSAP).toBe("function");
  });

  it("複数回 import しても registerPlugin は 1 回しか走らない", async () => {
    const a = await import("./gsap");
    const b = await import("./gsap");
    // 同じモジュールインスタンスが返る = 副作用は 1 回きり
    expect(a.gsap).toBe(b.gsap);
    expect(a.registeredPlugins).toEqual(["useGSAP", "ScrollTrigger"]);
  });
});
