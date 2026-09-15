"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import {
  TRIPLETS,
  layoutTriplet,
  type PlacedTriplet,
} from "@/lib/vocabulary-field";

/**
 * ページ常駐の背景「語彙空間」。
 *
 * 同じ概念の 日本語・中国語・英語 が寄り添って漂い、細い線で結ばれている。
 * ときどきひと組だけが灯って、三言語が同じものを指していることが見える。
 * 応用言語学 × 機械学習という主題と、北京→横浜→北京→京都という経歴を
 * そのまま背景にしたもので、汎用的な粒子アニメーションの代わりになる。
 *
 * 実装上の選択:
 * - **SVG テキスト**で描く。サイト本体と同じ書体がそのまま使えるので、
 *   外から持ち込んだ canvas ではなく地続きの意匠になる。WebGL も
 *   three.js も要らない（バンドルは増えない）。
 * - 座標は 0..1 の割合で持ち、実寸は測ってから掛ける。ResizeObserver で
 *   追従するので、どの画面比でも字が歪まない。
 * - 動かすのは transform と opacity だけ。要素は数十個なので、
 *   粒子 14,000 点と違って実質ゼロコスト。
 */

const DRIFT = 26; // 漂う振れ幅（px）
const RADIUS_BASE = 52; // 組の広がり（px, 1280px 幅基準）

export default function VocabularyField() {
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // 実寸を測ってから配置する（アスペクト比で字が歪まないように、
  // viewBox は 1 単位 = 1px にする）。
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

  const radius = Math.max(34, Math.min(RADIUS_BASE, size.w / 24));
  const placed: PlacedTriplet[] =
    size.w > 0
      ? TRIPLETS.map((t, i) => layoutTriplet(t, i, size.w, size.h, radius))
      : [];

  const fontFor = useCallback((lang: "ja" | "zh" | "en") => {
    // 英語だけ一段小さく、字間を開ける。三言語が同じ大きさだと
    // ラテン文字が間延びして見えるため。
    if (lang === "en") return { size: 12, spacing: "0.08em", weight: 500 };
    return { size: 16, spacing: "0.04em", weight: 500 };
  }, []);

  useGSAP(
    () => {
      if (placed.length === 0) return;
      const mm = gsap.matchMedia();

      // 768px 未満は CSS 側で display:none。見えないもののために
      // タイムラインを回さないよう、ここでも同じ閾値で切る。
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        // 1) ゆっくり漂う。組ごとに速度と位相を変えて、
        //    同期して揺れる（＝機械的に見える）のを避ける。
        gsap.utils.toArray<SVGGElement>("[data-triplet]").forEach((g, i) => {
          gsap.to(g, {
            x: `random(${-DRIFT}, ${DRIFT})`,
            y: `random(${-DRIFT}, ${DRIFT})`,
            duration: 14 + (i % 5) * 3,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            repeatRefresh: true,
            delay: i * 0.7,
          });
        });

        // 2) Hero を抜けたら背景を退かせる。固定背景は本文の背後に
        //    居続けるので、文字量の多い帯では可読性を優先する。
        gsap.fromTo(
          hostRef.current,
          { opacity: 1 },
          {
            opacity: 0.45,
            ease: "none",
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: () => `+=${window.innerHeight * 0.9}`,
              scrub: 0.5,
            },
          },
        );

        // 3) ひと組ずつ順番に灯る。三言語が同じ概念を指していることを
        //    見せる、この背景の中心的な仕掛け。
        const cycle = gsap.timeline({ repeat: -1 });
        placed.forEach((_, i) => {
          cycle
            .to(`[data-triplet="${i}"] [data-word]`, {
              opacity: 1,
              fill: "var(--color-accent)",
              duration: 1.1,
              stagger: 0.14,
              ease: "power2.out",
            })
            .to(
              `[data-triplet="${i}"] [data-link]`,
              { opacity: 0.5, duration: 0.9, ease: "power2.out" },
              "<",
            )
            .to({}, { duration: 1.6 })
            .to(`[data-triplet="${i}"] [data-word]`, {
              opacity: 0.3,
              fill: "var(--color-ink-muted)",
              duration: 1.4,
              ease: "power2.inOut",
            })
            .to(
              `[data-triplet="${i}"] [data-link]`,
              { opacity: 0.12, duration: 1.4, ease: "power2.inOut" },
              "<",
            );
        });
      });

      return () => mm.revert();
    },
    { scope: svgRef, dependencies: [placed.length] },
  );

  return (
    <div ref={hostRef} className="vocab-field" aria-hidden>
      {size.w > 0 && (
        <svg
          ref={svgRef}
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
        >
          {placed.map((p, i) => (
            <g key={i} data-triplet={i}>
              {p.links.map((l, j) => (
                <line
                  key={j}
                  data-link
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke="var(--color-accent)"
                  strokeWidth="1"
                  opacity="0.12"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {p.words.map((w, j) => {
                const f = fontFor(w.lang);
                return (
                  <text
                    key={j}
                    data-word
                    x={w.x}
                    y={w.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--color-ink-muted)"
                    opacity="0.3"
                    style={{
                      fontSize: f.size,
                      fontWeight: f.weight,
                      letterSpacing: f.spacing,
                    }}
                  >
                    {w.text}
                  </text>
                );
              })}
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
