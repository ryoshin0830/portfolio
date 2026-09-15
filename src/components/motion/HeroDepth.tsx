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
      <span className="depth-word">{word}</span>
      <span className="depth-orbit" />
      <span className="depth-orbit depth-orbit--two" />
    </div>
  );
}
