"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { TRACK_RATIO, buildRail } from "@/lib/scroll-rail";

/**
 * セクション間の空白帯に置く、横に流れる「語彙空間の断面」。
 *
 * 画面全体を覆う背景はどれだけ薄めても必ず本文の裏に回り、可読性を削る。
 * このサイトにはセクション間に大きな空白があるので、そこだけを舞台にする。
 * **本文の裏には一切入らない。** 帯が横長であることを活かして、縦スクロールを
 * 横の動きに変換している。
 *
 * 帯ごとに向きを交互にすると（左→右→左）、ページを下るリズムが出る。
 *
 * 動きは ScrollTrigger の scrub なので、スクロールしていない間は 1 フレームも
 * 進まない（常時ループを作らない）。
 */

export default function ScrollRail({
  direction = "left",
  seed = 1,
  count = 30,
  label,
}: {
  /** 下スクロールでトラックが流れる向き。 */
  direction?: "left" | "right";
  seed?: number;
  count?: number;
  /**
   * 帯の左端に小さく添える語。装飾ではなく「この先のセクションは何か」を
   * 示す道標なので、空欄なら何も描かない。
   */
  label?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<SVGSVGElement>(null);
  const rail = buildRail(seed, count);

  // トラックは画面より広く、CSS で中央寄せしてある。そこを基準に
  // 左右対称に振る（±SWING%）。
  //
  // 以前は「left は 0 → -60%、right は -60% → 0」と非対称にしていたが、
  // これだと向きによって開始位置が違い、どちらか一方が先に終端へ達して
  // ほとんど動かなく見えた。中央基準の対称スイングなら向きを反転しても
  // 振れ幅が揃う。
  const dir = direction === "left" ? 1 : -1;
  const SWING = 18;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          trackRef.current,
          { xPercent: dir * SWING },
          {
            xPercent: -dir * SWING,
            ease: "none",
            scrollTrigger: {
              trigger: hostRef.current,
              // 帯が画面に入ってから抜けるまでを使い切る
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
              // 下の発信フィードは段階的に描画されてページが伸びるので、
              // 再計測時に開始/終了位置を取り直さないと範囲が古いままになり、
              // 帯に着く前にアニメーションが終わってしまう。
              invalidateOnRefresh: true,
            },
          },
        );

        // 点は帯より少しだけ速く流す。二段の速度差で奥行きが出る。
        gsap.fromTo(
          "[data-rail-points]",
          { xPercent: dir * 5 },
          {
            xPercent: -dir * 5,
            ease: "none",
            scrollTrigger: {
              trigger: hostRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
              invalidateOnRefresh: true,
            },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: hostRef, dependencies: [direction] },
  );

  const width = 1000 * TRACK_RATIO;
  const height = 120;

  return (
    <div ref={hostRef} className="scroll-rail" aria-hidden>
      {label && <span className="scroll-rail__label">{label}</span>}
      <svg
        ref={trackRef}
        className="scroll-rail__track"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {/* 基準線。セクションを分ける罫としても働く。 */}
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="var(--color-rule-soft)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <g data-rail-points>
          {rail.links.map((l, i) => {
            const a = rail.points[l.a];
            const b = rail.points[l.b];
            return (
              <line
                key={i}
                x1={a.x * width}
                y1={a.y * height}
                x2={b.x * width}
                y2={b.y * height}
                stroke="var(--color-accent)"
                strokeWidth="1"
                opacity="0.3"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          {rail.points.map((p, i) => (
            <circle
              key={i}
              cx={p.x * width}
              cy={p.y * height}
              // preserveAspectRatio="none" で横に伸びるため、
              // 点は ellipse ではなく非伸縮の stroke で描いて真円を保つ
              r="0.1"
              fill="none"
              stroke={p.accent ? "var(--color-accent)" : "var(--color-ink-muted)"}
              strokeWidth={p.r * 2}
              strokeLinecap="round"
              opacity={p.accent ? 0.85 : 0.45}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
