"use client";

import { useEffect, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Line,
  LineBasicMaterial,
  NormalBlending,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";

/**
 * Hero 背面の粒子フィールド。
 *
 * スクロールに応じて トーラス → 球 → らせん と形を変え、最後にほどける。
 * 「ことばを扱う機械学習」という主題の視覚化であって、意味のある情報は
 * 持たないので aria-hidden。
 *
 * 性能（CLAUDE.md のアニメーション性能ルール）:
 * - IntersectionObserver で画面外に出たら描画を止める
 * - visibilitychange でタブ非表示でも止める
 * - prefers-reduced-motion では**そもそもループを回さず静止フレームを 1 枚だけ**描く
 * - 30fps に間引く（60fps にする視覚的な意味が無く、電力だけ食う）
 * - devicePixelRatio は 1.6 で頭打ち
 * - WebGL が使えない環境では静かに何も描かない（throw しない）
 *
 * 配色: ライトは白地に沈む青が見えないので **NormalBlending + 濃いめの青**、
 * ダークは黒地で加算合成が映えるので **AdditiveBlending + 明るい青**に切り替える。
 * どちらも --color-accent の色相に寄せてある。
 */

type Props = {
  /** true でダーク配色（加算合成）に切り替える。 */
  dark: boolean;
};

const COUNT_DESKTOP = 14000;
const COUNT_MOBILE = 7000;

export default function HeroParticles({ dark }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  // 最新の dark をアニメーションループから読むための箱（再マウントを避ける）。
  const darkRef = useRef(dark);
  darkRef.current = dark;

  useEffect(() => {
    const el = mount.current;
    if (!el) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      // WebGL 非対応・GPU ブロック時は静かに諦める（Hero は文字だけで成立する）
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    el.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.z = 7.6;

    const group = new Group();
    const backdrop = new Group();
    scene.add(group, backdrop);

    // ── 軌道線（奥行きの手がかり） ─────────────────────────
    const orbitGeos: BufferGeometry[] = [];
    const orbitMats: LineBasicMaterial[] = [];
    for (let k = 0; k < 3; k++) {
      const pts: Vector3[] = [];
      for (let i = 0; i <= 180; i++) {
        const a = (i / 180) * Math.PI * 2;
        const r = 2.45 + k * 0.24;
        pts.push(new Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
      }
      const geo = new BufferGeometry().setFromPoints(pts);
      const mat = new LineBasicMaterial({ transparent: true });
      const line = new Line(geo, mat);
      line.rotation.set(0.7 + k * 0.65, k * 0.9, 0.2);
      backdrop.add(line);
      orbitGeos.push(geo);
      orbitMats.push(mat);
    }

    // ── 粒子 ────────────────────────────────────────────
    const n = window.innerWidth < 700 ? COUNT_MOBILE : COUNT_DESKTOP;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const params = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      params[i * 3] = Math.random() * Math.PI * 2;
      params[i * 3 + 1] = Math.random() * Math.PI * 2;
      params[i * 3 + 2] = Math.random();
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(pos, 3));
    geometry.setAttribute("color", new BufferAttribute(col, 3));
    const material = new PointsMaterial({
      size: 0.015,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
    });
    group.add(new Points(geometry, material));
    group.rotation.set(0.5, -0.2, -0.4);

    /**
     * 配色をテーマに合わせて塗り直す。
     * ライト: 白地なので加算合成だと飛んでしまう。通常合成 + 濃い青。
     * ダーク: 黒地なので加算合成で光らせる + 明るい青。
     */
    let paintedDark: boolean | null = null;
    const paint = (isDark: boolean) => {
      if (paintedDark === isDark) return;
      paintedDark = isDark;
      const c = new Color();
      for (let i = 0; i < n; i++) {
        const r = params[i * 3 + 2];
        if (isDark) {
          // 加算合成は重なるほど白へ飛ぶ。明度を抑えめに置くことで、
          // 密な中心部がちょうど白く光り、周縁は青のまま残る。
          c.setHSL(0.58 + r * 0.05, 0.95, 0.4 + r * 0.2);
        } else {
          // 白地では明るい青は飛んでしまう。藍〜濃紺まで落として、
          // 粒が「点」として見えるコントラストを確保する。
          c.setHSL(0.6 - r * 0.03, 0.78, 0.2 + r * 0.18);
        }
        col.set([c.r, c.g, c.b], i * 3);
      }
      geometry.attributes.color.needsUpdate = true;
      material.blending = isDark ? AdditiveBlending : NormalBlending;
      // ライトは加算合成が使えないぶん、粒を大きく・濃くして密度を稼ぐ。
      material.opacity = isDark ? 0.72 : 0.8;
      material.size = isDark ? 0.016 : 0.022;
      material.needsUpdate = true;

      orbitMats.forEach((m, k) => {
        m.color.set(isDark ? 0x2997ff : 0x0071e3);
        m.opacity = (isDark ? 0.12 : 0.14) + k * 0.03;
      });
    };
    paint(dark);

    // ── 入力（スクロール / ポインタ） ───────────────────────
    let scrollTarget = 0;
    let scrollAmount = 0;
    const onScroll = () => {
      if (reduced) return;
      scrollTarget = Math.max(
        0,
        Math.min(1, window.scrollY / (window.innerHeight * 1.1))
      );
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const mouse = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 0.25;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 0.2;
    };
    if (!reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
    }

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let t = 0;
    let last = 0;
    function draw(now: number) {
      raf = requestAnimationFrame(draw);
      if (now - last < 32) return; // ~30fps に間引く（電力の無駄を削る）
      last = now;

      paint(darkRef.current);
      t += 0.005;
      scrollAmount += (scrollTarget - scrollAmount) * 0.09;
      writePositions(t, scrollAmount);
      applyCamera(t, scrollAmount);
      renderer.render(scene, camera);
    }

    // ── 実行ゲート（画面外 / タブ非表示では回さない） ──────────
    // 「フレーム内で早期 return」ではなく **rAF ループ自体を止める**。
    // 早期 return だと毎フレームのコールバック予約が残り続けるため。
    let onScreen = true;
    let tabVisible = true;
    let raf = 0;

    const shouldRun = () => !reduced && onScreen && tabVisible;
    const sync = () => {
      if (shouldRun() && raf === 0) {
        last = 0;
        raf = requestAnimationFrame(draw);
      } else if (!shouldRun() && raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      sync();
    });
    io.observe(el);

    const onVisibility = () => {
      tabVisible = document.visibilityState === "visible";
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // ── 形状 ───────────────────────────────────────────
    const writePositions = (t: number, s: number) => {
      for (let i = 0; i < n; i++) {
        const u = params[i * 3];
        const v = params[i * 3 + 1];
        const r = params[i * 3 + 2];

        // ベース: トーラス（ゆるく脈打つ）
        const radius = 1.42 + 0.12 * Math.sin(u * 3 + t);
        const tube = 0.54 + 0.16 * Math.cos(u * 3 + t);
        let x = (radius + tube * Math.cos(v)) * Math.cos(u);
        let y = (radius + tube * Math.cos(v)) * Math.sin(u);
        let z = tube * Math.sin(v) + 0.28 * Math.sin(3 * u + t);

        // → 球
        const phi = Math.acos(2 * r - 1);
        const blend = Math.min(1, s * 2);
        x += (1.85 * Math.sin(phi) * Math.cos(u) - x) * blend;
        y += (1.85 * Math.cos(phi) - y) * blend;
        z += (1.85 * Math.sin(phi) * Math.sin(u) - z) * blend;

        // → らせん
        const twist = Math.max(0, (s - 0.5) * 2);
        const rr = 0.6 + r * 0.9;
        x += (rr * Math.cos(u * 2) - x) * twist;
        y += ((u / Math.PI - 1) * 2 - y) * twist;
        z += (rr * Math.sin(u * 2) - z) * twist;

        // → ほどける
        const burst = Math.max(0, (s - 0.73) / 0.27);
        const drift = burst * burst * (1 + r * 2);
        x += Math.sin(u * 3 + v) * drift;
        y += Math.cos(v * 2 + u) * drift;
        z += Math.sin(v + u * 2) * drift;

        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
      }
      geometry.attributes.position.needsUpdate = true;
    };

    const applyCamera = (t: number, s: number) => {
      group.rotation.y = t * 0.3 + mouse.x + s * Math.PI;
      group.rotation.x = 0.6 + mouse.y - s * 0.5;
      backdrop.rotation.y = -t * 0.08 - s * 0.35;
      backdrop.rotation.z = t * 0.025;
      backdrop.position.x = -mouse.x * 0.7;
      backdrop.position.y = -mouse.y * 0.7;
      camera.position.z = 7.6 - s * 0.8;
    };

    resize();

    // reduced-motion: 静止フレームを 1 枚だけ描いて終わり（ループを作らない）
    if (reduced) {
      writePositions(0, 0);
      applyCamera(0, 0);
      renderer.render(scene, camera);
    }

    sync();

    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      geometry.dispose();
      material.dispose();
      orbitGeos.forEach((g) => g.dispose());
      orbitMats.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
    // `dark` は意図的に依存から外している。依存に入れるとテーマ切替のたびに
    // WebGL コンテキストごとシーンを作り直すことになる（数万点の再確保 +
    // コンテキスト再生成）。実際の配色はループ内で darkRef を読んで
    // paint() が差分適用するので、再マウントは不要。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mount} className="hero-particles" aria-hidden />;
}
