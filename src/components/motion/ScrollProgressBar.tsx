"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * ページ上端の読書プログレスバー。
 *
 * ドキュメント全体のスクロール量を scrub で scaleX に写すだけなので、
 * スクロールしていない間は 1 フレームも回らない（常時ループにならない）。
 */
export default function ScrollProgressBar() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to(ref.current, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.2,
        },
      });
    });
    return () => mm.revert();
  });

  return <div ref={ref} className="scroll-progress" aria-hidden />;
}
