import { describe, expect, it } from "vitest";
import {
  LAYERS,
  MAX_LINK_DISTANCE,
  TILE_RATIO,
  buildLayers,
} from "./vocabulary-field";

describe("vocabulary-field", () => {
  it("奥から手前まで 4 層ある", () => {
    expect(LAYERS).toHaveLength(4);
    expect(LAYERS[0].depth).toBe(0);
    expect(LAYERS[LAYERS.length - 1].depth).toBe(1);
  });

  it("移動係数が奥ほど小さい（これが視差の本体）", () => {
    for (let i = 1; i < LAYERS.length; i++) {
      expect(LAYERS[i].rate).toBeGreaterThan(LAYERS[i - 1].rate);
    }
  });

  it("最前面と最奥で移動量が大きく違う（差が小さいと奥行きが見えない）", () => {
    const far = LAYERS[0].rate;
    const near = LAYERS[LAYERS.length - 1].rate;
    expect(near / far).toBeGreaterThan(5);
  });

  it("奥ほど点が小さく薄い", () => {
    for (let i = 1; i < LAYERS.length; i++) {
      expect(LAYERS[i].opacity).toBeGreaterThan(LAYERS[i - 1].opacity);
      const prevMax = Math.max(...LAYERS[i - 1].points.map((p) => p.r));
      const curMax = Math.max(...LAYERS[i].points.map((p) => p.r));
      expect(curMax).toBeGreaterThan(prevMax);
    }
  });

  it("座標はすべて 0..1 の割合に収まる", () => {
    for (const layer of LAYERS) {
      for (const p of layer.points) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it("生成は決定的（SSR とクライアントで一致する）", () => {
    expect(buildLayers()).toEqual(buildLayers());
  });

  it("シードを変えれば配置も変わる", () => {
    expect(buildLayers(1)[0].points[0]).not.toEqual(buildLayers(2)[0].points[0]);
  });

  it("リンクは手前 2 層だけに張る（奥まで引くと線が騒がしい）", () => {
    expect(LAYERS[0].links).toHaveLength(0);
    expect(LAYERS[1].links).toHaveLength(0);
    expect(LAYERS[2].links.length).toBeGreaterThan(0);
    expect(LAYERS[3].links.length).toBeGreaterThan(0);
  });

  it("リンクは実在する点を指し、自分自身には張らない", () => {
    for (const layer of LAYERS) {
      for (const l of layer.links) {
        expect(l.a).toBeGreaterThanOrEqual(0);
        expect(l.a).toBeLessThan(layer.points.length);
        expect(l.b).toBeGreaterThanOrEqual(0);
        expect(l.b).toBeLessThan(layer.points.length);
        expect(l.a).not.toBe(l.b);
      }
    }
  });

  it("リンクは短いものだけ（長い線は本文を斜めに横切って騒がしい）", () => {
    for (const layer of LAYERS) {
      for (const l of layer.links) {
        const a = layer.points[l.a];
        const b = layer.points[l.b];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        expect(d).toBeLessThanOrEqual(MAX_LINK_DISTANCE + 1e-9);
      }
    }
  });

  it("点は塊になっている（一様だとただの砂嵐になる）", () => {
    // 最奥層を 4x4 の格子に割り、密度の偏りを見る。一様分布なら
    // 最大セルと平均の比は 2 倍程度に収まる。
    const pts = LAYERS[0].points;
    const grid = new Array(16).fill(0);
    for (const p of pts) {
      const gx = Math.min(3, Math.floor(p.x * 4));
      const gy = Math.min(3, Math.floor(p.y * 4));
      grid[gy * 4 + gx]++;
    }
    const mean = pts.length / 16;
    expect(Math.max(...grid) / mean).toBeGreaterThan(2.2);
  });

  it("タイルはビューポートより高い（剰余で巻き戻しても隙間が出ない）", () => {
    expect(TILE_RATIO).toBeGreaterThan(1);
  });
});
