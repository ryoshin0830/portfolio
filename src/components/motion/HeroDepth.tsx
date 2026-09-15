"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Hero 背面の奥行きレイヤー。アウトライン文字と 2 つの軌道円を、
 * それぞれ違う scrub 速度で動かして視差を作る。
 *
 * 初期 transform は当てない（マウント時に gsap.set を打たない）ので、
 * ファーストビューの描画は静止画と同じ。スクロールして初めて動く。
 */
export default function HeroDepth({ word }: { word: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const st = (scrub: number) => ({
          trigger: ref.current,
          start: "top top",
          end: "bottom top",
          scrub,
        });
        gsap.to(".depth-word", {
          xPercent: -14,
          yPercent: 24,
          ease: "none",
          scrollTrigger: st(1.8),
        });
        gsap.to(".depth-orbit:not(.depth-orbit--two)", {
          rotation: 70,
          scale: 1.3,
          yPercent: -10,
          ease: "none",
          scrollTrigger: st(1.4),
        });
        gsap.to(".depth-orbit--two", {
          rotation: -90,
          scale: 0.8,
          xPercent: -14,
          ease: "none",
          scrollTrigger: st(1),
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className="hero-depth" aria-hidden>
      {/* アウトライン文字はインライン SVG の <text> で描く。
          - textLength + lengthAdjust で viewBox 幅にぴったり合わせるので、
            語の長さやフォントのメトリクスが変わってもレイアウトが動かない。
          - stroke は標準の SVG プロパティ。-webkit-text-stroke は非標準。
          - vector-effect でズームしてもヘアラインのまま。
          なお、この要素は巨大なので Chrome では LCP 要素として選ばれる
          （SVG text も LCP 候補になる）。ただし初期 HTML に含まれる静的な
          描画で、実測でも LCP 候補はこれ 1 つだけ・408ms と、hero の
          他の要素と同じタイミングで塗られている。スクロール時の transform は
          LCP を再計測させないので、計測を遅らせる要因にはなっていない。 */}
      <svg
        className="depth-word"
        viewBox="0 0 1000 200"
        preserveAspectRatio="none"
        aria-hidden
      >
        <text
          x="0"
          y="160"
          textLength="1000"
          lengthAdjust="spacingAndGlyphs"
          vectorEffect="non-scaling-stroke"
        >
          {word}
        </text>
      </svg>
      <span className="depth-orbit" />
      <span className="depth-orbit depth-orbit--two" />
    </div>
  );
}
