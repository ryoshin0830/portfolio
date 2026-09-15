import { describe, expect, it } from "vitest";
import { MAX_LINK_DX, TRACK_RATIO, buildRail } from "./scroll-rail";

describe("scroll-rail", () => {
  const rail = buildRail(1, 30);

  it("指定した数の点を作る", () => {
    expect(rail.points).toHaveLength(30);
  });

  it("座標は 0..1 の割合に収まる", () => {
    for (const p of rail.points) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(1);
    }
  });

  it("点は x 昇順に並ぶ（リンク探索の早期打ち切りが成立する前提）", () => {
    for (let i = 1; i < rail.points.length; i++) {
      expect(rail.points[i].x).toBeGreaterThanOrEqual(rail.points[i - 1].x);
    }
  });

  it("帯の上下端に貼り付かない（切れて見えるのを防ぐ）", () => {
    for (const p of rail.points) {
      expect(p.y).toBeGreaterThan(0.1);
      expect(p.y).toBeLessThan(0.9);
    }
  });

  it("x はおおむね散らばる（帯の一部が空っぽにならない）", () => {
    // 5 分割したどの区間にも点がある
    const buckets = new Array(5).fill(0);
    for (const p of rail.points) buckets[Math.min(4, Math.floor(p.x * 5))]++;
    for (const b of buckets) expect(b).toBeGreaterThan(0);
  });

  it("リンクは近い者どうしだけ（帯を貫く長い線を作らない）", () => {
    expect(rail.links.length).toBeGreaterThan(0);
    for (const l of rail.links) {
      const dx = Math.abs(rail.points[l.a].x - rail.points[l.b].x);
      expect(dx).toBeLessThanOrEqual(MAX_LINK_DX + 1e-9);
    }
  });

  it("リンクは実在する点を指し、自分自身には張らない", () => {
    for (const l of rail.links) {
      expect(l.a).toBeGreaterThanOrEqual(0);
      expect(l.a).toBeLessThan(rail.points.length);
      expect(l.b).toBeGreaterThanOrEqual(0);
      expect(l.b).toBeLessThan(rail.points.length);
      expect(l.a).not.toBe(l.b);
    }
  });

  it("アクセントの点は一部だけ（全部青いと図として騒がしい）", () => {
    const accents = rail.points.filter((p) => p.accent).length;
    expect(accents).toBeGreaterThan(0);
    expect(accents / rail.points.length).toBeLessThan(0.45);
  });

  it("生成は決定的（SSR とクライアントで一致する）", () => {
    expect(buildRail(7, 20)).toEqual(buildRail(7, 20));
  });

  it("シードを変えれば別の帯になる", () => {
    expect(buildRail(1, 20).points).not.toEqual(buildRail(2, 20).points);
  });

  it("トラックは画面より広い（横に流しても端が見えない）", () => {
    expect(TRACK_RATIO).toBeGreaterThan(1);
  });
});
