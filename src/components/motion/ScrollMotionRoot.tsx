"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

/**
 * ページ全体のスクロール演出を 1 箇所に集約するクライアント境界。
 *
 * セクション側は data 属性（data-reveal / data-reveal-head / data-stagger /
 * tilt-card / wipe-row / data-magnetic）を付けるだけでよく、Server Component の
 * ままでいられる。セクション固有で内部状態を持つもの（Projects の横スクロール
 * 進捗、Highlights の数値）だけは各コンポーネントの useGSAP に置く。
 *
 * 性能: ここで作るのは全て ScrollTrigger の scrub か一度きりのリビールで、
 * repeat の常時ループは 1 つも無い。スクロールしていない間はティッカーが
 * 進まないので、画面外で回り続けることがない。
 */
export default function ScrollMotionRoot({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // 見出し: scrub で左から寄る
        gsap.utils.toArray<HTMLElement>("[data-reveal-head]").forEach((el) => {
          gsap.from(el, {
            x: -40,
            opacity: 0.25,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 92%",
              end: "top 45%",
              scrub: 0.8,
            },
          });
        });

        // 汎用リビール（一度きり）。
        // gsap.from ではなく fromTo + immediateRender: false を使う。from は
        // トゥイーン生成の瞬間に開始状態(opacity: 0)を適用してしまうため、
        // 何らかの理由でトリガが発火しないと**本文が永久に見えなくなる**。
        // fromTo + immediateRender: false なら、トリガが来るまで要素は素の
        // 状態のままなので、最悪でも「アニメーションしないだけ」で済む。
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.fromTo(
            el,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              ease: "power2.out",
              immediateRender: false,
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
            }
          );
        });

        // stagger グループ（chip 群など）
        gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((group) => {
          gsap.fromTo(
            group.children,
            { y: 20, scale: 0.9, opacity: 0 },
            {
              y: 0,
              scale: 1,
              opacity: 1,
              duration: 0.45,
              stagger: 0.04,
              ease: "power2.out",
              immediateRender: false,
              scrollTrigger: { trigger: group, start: "top 90%", once: true },
            }
          );
        });

        // Hero の kinetic タイポ: スクロールアウトで飛散する。
        // start を hero 下端付近に置くので、ファーストビューでは一切動かない
        // （= LCP 計測ウィンドウ中に LCP 要素を変形させない）。
        const hero = document.getElementById("hero");
        const letters = hero?.querySelectorAll<HTMLElement>(".kinetic-letter");
        if (hero && letters?.length) {
          gsap.to(letters, {
            yPercent: (i) => -30 - (i % 4) * 12,
            xPercent: (i) => (i % 2 ? 1 : -1) * (8 + i * 2),
            rotateX: 60,
            rotateZ: (i) => (i % 2 ? 1 : -1) * 10,
            opacity: 0,
            stagger: { each: 0.03, from: "edges" },
            ease: "power2.in",
            scrollTrigger: {
              trigger: hero,
              start: "bottom 90%",
              end: "bottom 30%",
              scrub: 1,
            },
          });
        }
      });

      // pointer tilt とマグネティックは「本物のマウス」がある環境だけ。
      // 条件から外れると matchMedia が自動で revert する。
      mm.add(
        "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          const cleanups: Array<() => void> = [];

          gsap.utils.toArray<HTMLElement>(".tilt-card").forEach((card) => {
            const rx = gsap.quickTo(card, "rotationX", {
              duration: 0.7,
              ease: "power3.out",
            });
            const ry = gsap.quickTo(card, "rotationY", {
              duration: 0.7,
              ease: "power3.out",
            });
            const move = (e: PointerEvent) => {
              const r = card.getBoundingClientRect();
              const x = (e.clientX - r.left) / r.width;
              const y = (e.clientY - r.top) / r.height;
              rx((0.5 - y) * 6);
              ry((x - 0.5) * 8);
              card.style.setProperty("--pointer-x", `${x * 100}%`);
              card.style.setProperty("--pointer-y", `${y * 100}%`);
            };
            const leave = () => {
              rx(0);
              ry(0);
            };
            card.addEventListener("pointermove", move);
            card.addEventListener("pointerleave", leave);
            cleanups.push(() => {
              card.removeEventListener("pointermove", move);
              card.removeEventListener("pointerleave", leave);
              rx.tween.kill();
              ry.tween.kill();
              gsap.set(card, { clearProps: "transform" });
            });
          });

          gsap.utils.toArray<HTMLElement>("[data-magnetic]").forEach((btn) => {
            const x = gsap.quickTo(btn, "x", { duration: 0.45, ease: "power3.out" });
            const y = gsap.quickTo(btn, "y", { duration: 0.45, ease: "power3.out" });
            const move = (e: PointerEvent) => {
              const r = btn.getBoundingClientRect();
              x((e.clientX - r.left - r.width / 2) * 0.25);
              y((e.clientY - r.top - r.height / 2) * 0.25);
            };
            const leave = () => {
              x(0);
              y(0);
            };
            btn.addEventListener("pointermove", move);
            btn.addEventListener("pointerleave", leave);
            cleanups.push(() => {
              btn.removeEventListener("pointermove", move);
              btn.removeEventListener("pointerleave", leave);
              x.tween.kill();
              y.tween.kill();
              gsap.set(btn, { clearProps: "transform" });
            });
          });

          return () => cleanups.forEach((fn) => fn());
        }
      );

      // 日本語フォントの読込でレイアウトが確定してから位置を取り直す。
      if (typeof document !== "undefined" && document.fonts?.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }

      return () => mm.revert();
    },
    { scope }
  );

  return <div ref={scope}>{children}</div>;
}
