"use client";

import { useEffect, useRef, useState } from "react";

type Direction = "east" | "west";

const TimelinePlaneMark = ({ direction }: { direction: Direction }) => {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }

    const node = wrapperRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.6, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const enterTx = direction === "east" ? -18 : 18;
  const enterRotate = direction === "east" ? -4 : 4;

  return (
    <span
      ref={wrapperRef}
      aria-hidden="true"
      className="mt-2 justify-self-end translate-x-1 inline-block"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateX(0) rotate(0deg)"
          : `translateX(${enterTx}px) rotate(${enterRotate}deg)`,
        transition:
          "opacity 820ms cubic-bezier(0.22, 1, 0.36, 1), transform 820ms cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "transform, opacity",
      }}
    >
      <svg
        viewBox="0 0 28 24"
        fill="none"
        aria-hidden="true"
        className="w-9 h-6 sm:w-11 sm:h-7"
        style={{
          // Glyph path is authored pointing west (nose at x=2.5). Flip for east.
          transform:
            direction === "east" ? "scaleX(-1)" : undefined,
          transformOrigin: "center",
        }}
      >
        <path
          d="M2.5 12.5L25 8.5M2.5 12.5L25 16.5M9.5 11.3L13.1 6.5M9.5 13.7L13.1 18.5M2.5 12.5H6.4"
          pathLength={1}
          stroke="var(--color-teal-ink)"
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={{
            strokeDasharray: 1,
            strokeDashoffset: visible ? 0 : 1,
            transition:
              "stroke-dashoffset 620ms cubic-bezier(0.32, 0, 0.2, 1) 120ms",
          }}
        />
      </svg>
    </span>
  );
};

export default TimelinePlaneMark;
