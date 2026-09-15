"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * 巨大文字の帯。上段と下段を逆方向に流してページに横方向の運動を足す。
 *
 * 完全な装飾なので aria-hidden（同じ語を繰り返すだけで情報が無い）。
 * セクションではないので id を持たず、SECTION_IDS にも登録しない。
 */
export default function MarqueeRibbon({ words }: { words: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  // 画面幅より確実に長くするため 3 周分並べる（流れても切れ目が見えない）。
  const line = [...words, ...words, ...words];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const st = (scrub: number) => ({
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub,
        });
        gsap.to(".ribbon-line--forward", {
          xPercent: -20,
          ease: "none",
          scrollTrigger: st(1.2),
        });
        gsap.to(".ribbon-line--back", {
          xPercent: 20,
          ease: "none",
          scrollTrigger: st(1.6),
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className="motion-ribbon" aria-hidden>
      <div className="ribbon-line ribbon-line--forward">
        {line.map((w, i) => (
          <span key={`f-${i}`}>{w}</span>
        ))}
      </div>
      <div className="ribbon-line ribbon-line--back">
        {line.map((w, i) => (
          <span key={`b-${i}`} className={i % 2 ? "ribbon-word--outline" : undefined}>
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}
