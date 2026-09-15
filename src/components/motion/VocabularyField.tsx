"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { LAYERS, TILE_RATIO } from "@/lib/vocabulary-field";

/**
 * ページ常駐の背景「語彙空間」。奥行きの違う 4 層が、スクロールに対して
 * まったく違う速度で流れる（＝視差）。
 *
 * 既存の VocabScatter（語彙プロファイラーの Word2Vec 散布図）と同じ
 * 視覚語彙——点と最近傍リンク——を背景に広げたもの。
 *
 * **文字は置かない。** 背景に語を並べると前景の本文と「読もうとする」
 * 知覚を奪い合い、マスクや不透明度では解決しない。点なら読む対象に
 * ならないので、可読性を削らずに密度を出せる。
 *
 * 視差の作り方（ここが以前は機能していなかった）:
 * - コンテナは `position: fixed` だが、**中の層はスクロール量に比例して
 *   translate する**。fixed のまま何も動かさないと相対運動が起きず、
 *   視差はゼロになる。
 * - 層ごとの移動係数を大きく離す（最奥 0.06 ↔ 最前 0.62、約 10 倍）。
 *   ここが近いと「動いているのに奥行きが見えない」状態になる。
 * - 各層はタイルを 2 枚縦に並べ、移動量をタイル高で剰余にして巻き戻す。
 *   これで何ページ分スクロールしても途切れずに流れ続ける。
 *
 * 剰余で巻き戻す都合上、位置はトゥイーンで補間できない（巻き戻し点で
 * 必ず不連続になる）。なので scrub ではなく passive なスクロール購読 +
 * gsap.quickSetter で直接書く。スクロールしていない間は 1 フレームも
 * 動かないので、常時ループにはならない。
 */

export default function VocabularyField() {
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tile = Math.round(size.h * TILE_RATIO);

  useGSAP(
    () => {
      if (size.w === 0) return;
      const mm = gsap.matchMedia();

      // 768px 未満は CSS 側で display:none。見えないもののために
      // 計算を回さないよう、ここでも同じ閾値で切る。
      mm.add(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        () => {
          const groups = gsap.utils.toArray<SVGGElement>("[data-layer]");
          if (groups.length === 0) return;

          // 層ごとに 1 本ずつ setter を用意して使い回す（毎フレーム作らない）
          const setters = groups.map((g) => gsap.quickSetter(g, "y", "px"));
          const rates = groups.map((g) => Number(g.dataset.rate));

          let ticking = false;
          const apply = () => {
            ticking = false;
            const y = window.scrollY;
            for (let i = 0; i < setters.length; i++) {
              // 手前ほど速く上へ流れる。タイル高で剰余を取り、
              // 2 枚重ねてあるので巻き戻りは見えない。
              setters[i](-((y * rates[i]) % tile));
            }
          };
          const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(apply);
          };

          window.addEventListener("scroll", onScroll, { passive: true });
          apply();

          // 本文の帯では背景を退かせる。視差は残しつつ可読性を優先する。
          gsap.fromTo(
            hostRef.current,
            { opacity: 1 },
            {
              opacity: 0.5,
              ease: "none",
              scrollTrigger: {
                trigger: document.documentElement,
                start: "top top",
                end: () => `+=${window.innerHeight}`,
                scrub: 0.4,
              },
            },
          );

          // 止まっていても最前面だけはゆっくり漂わせ、生きている状態を保つ。
          gsap.to(groups[groups.length - 1], {
            x: 18,
            duration: 11,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });

          return () => window.removeEventListener("scroll", onScroll);
        },
      );

      return () => mm.revert();
    },
    { scope: svgRef, dependencies: [size.w, size.h, tile] },
  );

  return (
    <div ref={hostRef} className="vocab-field" aria-hidden>
      {size.w > 0 && (
        <svg ref={svgRef} width={size.w} height={size.h}>
          {LAYERS.map((layer, li) => (
            <g key={li} data-layer={li} data-rate={layer.rate}>
              {/* タイルを 2 枚縦に並べる。剰余で巻き戻したとき、
                  2 枚目が継ぎ目を埋めるので流れが途切れない。 */}
              {[0, 1].map((copy) => (
                <g key={copy} transform={`translate(0, ${copy * tile})`}>
                  {layer.links.map((l, i) => {
                    const a = layer.points[l.a];
                    const b = layer.points[l.b];
                    return (
                      <line
                        key={i}
                        x1={a.x * size.w}
                        y1={a.y * tile}
                        x2={b.x * size.w}
                        y2={b.y * tile}
                        stroke="var(--color-accent)"
                        strokeWidth="1"
                        opacity={layer.opacity * 0.45}
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                  {layer.points.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x * size.w}
                      cy={p.y * tile}
                      r={p.r}
                      fill={
                        layer.depth >= 0.7
                          ? "var(--color-accent)"
                          : "var(--color-ink-muted)"
                      }
                      opacity={layer.opacity}
                    />
                  ))}
                </g>
              ))}
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
