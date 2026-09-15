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
 * ページ全体に常駐する粒子フィールド（position: fixed）。
 *
 * スクロールに応じて トーラス → 球 → らせん と形を変え、最後にゆるくほどける。
 * 「ことばを扱う機械学習」という主題の視覚化であって、意味のある情報は
 * 持たないので aria-hidden。
 *
 * 動きの方針:
 * - **静止していても動き続ける。** 脈動・旋回・ねじれを時間項で常に回し、
 *   「スクロールしないと何も起きない」状態を作らない。
 * - **形の変化は 2.5 画面分かけて進める。** 1 画面で終わらせると Hero を
 *   抜けた時点で見どころが尽きる。
 * - **Hero を抜けたら不透明度を 0.22 まで落とす。** 固定背景は本文の背後に
 *   居続けるので、読み物としての可読性をここで守る。
 *
 * 性能（CLAUDE.md のアニメーション性能ルール）:
 * - Hero にいる間は 60fps、抜けて薄くなったら 30fps に落とす
 * - visibilitychange でタブ非表示なら rAF ループ自体を止める
 * - prefers-reduced-motion では**そもそもループを回さず静止フレームを 1 枚だけ**描く
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
    // draw() は関数宣言（巻き上げ）なので、そのままだと el の null 絞り込みが
    // 効かない。絞り込み済みの値を別の const に受け直して閉じ込める。
    const root: HTMLDivElement = el;

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
    camera.position.z = 9.8;

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
    // 形の変化は 2.5 画面分かけて進める。1 画面で終わらせると、Hero を
    // 抜けた時点で「もう何も起きない」状態になってしまう。
    const MORPH_SPAN = 2.5;
    let scrollTarget = 0;
    let scrollAmount = 0;
    // 固定背景なので本文の上に重なり続ける。Hero を抜けたら不透明度を
    // 落として、読み物としての可読性を優先する。
    let fadeTarget = 1;
    let fade = 1;
    let heroInView = true;

    const onScroll = () => {
      if (reduced) return;
      const vh = window.innerHeight;
      scrollTarget = Math.max(0, Math.min(1, window.scrollY / (vh * MORPH_SPAN)));
      heroInView = window.scrollY < vh * 1.2;
      // Hero 内は 1.0、1 画面ぶん過ぎたら 0.22 まで落とす
      const past = Math.max(0, Math.min(1, (window.scrollY - vh * 0.35) / (vh * 0.8)));
      fadeTarget = 1 - past * 0.78;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    fade = fadeTarget;

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
      // Hero にいる間は主役なので 60fps、抜けて薄くなったら 30fps に落とす。
      // 常時 60fps だとページ全体をスクロールする間ずっと電力を食う。
      const interval = heroInView ? 16 : 32;
      if (now - last < interval) return;
      last = now;

      paint(darkRef.current);
      // 静止していても形が動き続ける速度。スクロール由来の変化が無い間も
      // 「生きている」状態を保つのが狙い。
      t += 0.011;
      scrollAmount += (scrollTarget - scrollAmount) * 0.09;
      fade += (fadeTarget - fade) * 0.12;
      root.style.opacity = String(fade);

      writePositions(t, scrollAmount);
      applyCamera(t, scrollAmount);
      renderer.render(scene, camera);
    }

    // ── 実行ゲート ─────────────────────────────────────────
    // position: fixed にしたので、この要素は常にビューポートと交差している。
    // つまり IntersectionObserver は永久に「画面内」を返すだけで意味を持たない
    // （以前は Hero の中にあったので機能していた）。残す価値が無いので外し、
    // タブ非表示だけをゲートにする。画面内での負荷は
    // 「Hero を抜けたら 30fps に落とす」側で抑える。
    //
    // 止め方は「フレーム内で早期 return」ではなく **rAF ループ自体の停止**。
    // 早期 return だと毎フレームのコールバック予約が残り続けるため。
    let tabVisible = true;
    let raf = 0;

    const shouldRun = () => !reduced && tabVisible;
    const sync = () => {
      if (shouldRun() && raf === 0) {
        last = 0;
        raf = requestAnimationFrame(draw);
      } else if (!shouldRun() && raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

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

        // ベース: トーラス。静止していても常に脈打ち、ねじれ、流れる。
        // 「スクロールしないと何も起きない」状態を作らないのが狙い。
        const breathe = 1 + 0.09 * Math.sin(t * 0.8);
        const swirl = u + t * 0.45; // 粒がリングに沿って流れ続ける
        const radius = (1.42 + 0.18 * Math.sin(swirl * 3 + t * 1.6)) * breathe;
        const tube = 0.54 + 0.22 * Math.cos(swirl * 3 + t * 1.2);
        let x = (radius + tube * Math.cos(v + t * 0.6)) * Math.cos(swirl);
        let y = (radius + tube * Math.cos(v + t * 0.6)) * Math.sin(swirl);
        let z = tube * Math.sin(v + t * 0.6) + 0.34 * Math.sin(3 * swirl + t * 1.4);

        // → 球（形が決まってからも表面をゆっくり回し続ける）
        const phi = Math.acos(2 * r - 1);
        const blend = Math.min(1, s * 2);
        const sphereA = u + t * 0.35;
        const sr = 1.85 * (1 + 0.05 * Math.sin(t * 1.1 + phi * 4));
        x += (sr * Math.sin(phi) * Math.cos(sphereA) - x) * blend;
        y += (sr * Math.cos(phi) - y) * blend;
        z += (sr * Math.sin(phi) * Math.sin(sphereA) - z) * blend;

        // → らせん（軸のまわりを回り続ける）
        const twist = Math.max(0, (s - 0.5) * 2);
        const rr = 0.6 + r * 0.9;
        const helixA = u * 2 + t * 0.8;
        x += (rr * Math.cos(helixA) - x) * twist;
        y += ((u / Math.PI - 1) * 2 - y) * twist;
        z += (rr * Math.sin(helixA) - z) * twist;

        // → ほどける。本文の背後に広がりすぎるとノイズになるので、
        // 参考サイトより控えめな振れ幅に留める。
        const burst = Math.max(0, (s - 0.8) / 0.2);
        const drift = burst * burst * (0.5 + r);
        x += Math.sin(u * 3 + v + t) * drift;
        y += Math.cos(v * 2 + u + t) * drift;
        z += Math.sin(v + u * 2 + t) * drift;

        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
      }
      geometry.attributes.position.needsUpdate = true;
    };

    const applyCamera = (t: number, s: number) => {
      // 形を上に逃がす。固定背景を画面いっぱいに置くと、Hero 右下の
      // 事実リスト（現職 / 学位 / 連絡先）の真上に重なって読みにくくなる。
      // 上に寄せると Hero の右上の空きに収まり、スクロール後は本文の
      // 見出し帯の高さに来るので文字量の多い段落と競合しない。
      group.position.y = 0.55;
      backdrop.position.y = 0.55 - mouse.y * 0.7;
      group.rotation.y = t * 0.3 + mouse.x + s * Math.PI;
      group.rotation.x = 0.6 + mouse.y - s * 0.5;
      backdrop.rotation.y = -t * 0.08 - s * 0.35;
      backdrop.rotation.z = t * 0.025;
      backdrop.position.x = -mouse.x * 0.7;
      camera.position.z = 9.8 - s * 1.1;
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
