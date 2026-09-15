"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * 固定の格子背景。ページ全体のスクロールに対してゆっくり上へ流し、
 * 前景のコンテンツとの間に視差を作る。装飾専用なので aria-hidden。
 *
 * 線は --color-rule-soft の 1px で、色のグラデーションは使っていない
 * （上下のフェードは色ではなくアルファマスク）。
 */
export default function AmbientGrid() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to(ref.current, {
        y: -160,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5,
        },
      });
    });
    return () => mm.revert();
  });

  return <div ref={ref} className="ambient-grid" aria-hidden />;
}
