"use client";

import { m, useReducedMotion } from "framer-motion";

/**
 * Faint animated "neural network" graph behind the hero.
 *
 * - Geometry is DETERMINISTIC (hardcoded literals) — no Math.random / Date.now,
 *   so SSR and client render identically (no hydration mismatch).
 * - Colors come from CSS custom properties, so light/dark adapt automatically
 *   with zero JS theme reads (no hydration flash).
 * - Honors prefers-reduced-motion: renders a single static frame, no loops.
 * - Stays within the manifesto: hairline strokes + small low-opacity dots,
 *   neutral ink with only a few accent nodes. No gradient, blur, glow or shadow.
 */

// viewBox 0 0 1200 800. Hand-placed on a loose grid with deterministic jitter.
const NODES: ReadonlyArray<{ cx: number; cy: number }> = [
  { cx: 90, cy: 120 }, // 0
  { cx: 250, cy: 70 }, // 1
  { cx: 410, cy: 160 }, // 2
  { cx: 560, cy: 90 }, // 3
  { cx: 720, cy: 150 }, // 4
  { cx: 880, cy: 80 }, // 5
  { cx: 1040, cy: 140 }, // 6
  { cx: 1140, cy: 60 }, // 7
  { cx: 150, cy: 300 }, // 8
  { cx: 330, cy: 360 }, // 9
  { cx: 500, cy: 300 }, // 10
  { cx: 660, cy: 380 }, // 11
  { cx: 820, cy: 320 }, // 12
  { cx: 990, cy: 360 }, // 13
  { cx: 1110, cy: 300 }, // 14
  { cx: 90, cy: 560 }, // 15
  { cx: 280, cy: 620 }, // 16
  { cx: 470, cy: 560 }, // 17
  { cx: 650, cy: 640 }, // 18
  { cx: 840, cy: 580 }, // 19
];

// Each pair connects two nearby nodes (precomputed nearest-neighbour links).
const EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
  [0, 8], [1, 9], [2, 10], [3, 10], [4, 11], [5, 12], [6, 13], [7, 14],
  [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14],
  [8, 15], [9, 16], [10, 17], [11, 18], [12, 19],
];

// A handful of accent nodes — the rest stay neutral ink.
const ACCENT_NODES = new Set<number>([3, 10, 17]);

export default function NeuralBackground() {
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-0"
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {/* Edges: static hairlines, neutral, very low opacity */}
        {EDGES.map(([a, b], i) => {
          const n1 = NODES[a];
          const n2 = NODES[b];
          return (
            <line
              key={i}
              x1={n1.cx}
              y1={n1.cy}
              x2={n2.cx}
              y2={n2.cy}
              stroke="var(--color-rule)"
              strokeWidth={1}
              strokeOpacity={0.12}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* Nodes: small dots, mostly neutral, a few accent. Gentle breathing. */}
        {NODES.map((n, i) => {
          const fill = ACCENT_NODES.has(i)
            ? "var(--color-accent)"
            : "var(--color-ink-muted)";

          if (reduce) {
            return (
              <circle key={i} cx={n.cx} cy={n.cy} r={3} fill={fill} opacity={0.28} />
            );
          }

          return (
            <m.circle
              key={i}
              cx={n.cx}
              cy={n.cy}
              r={3}
              fill={fill}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              initial={{ opacity: 0.18, scale: 1 }}
              animate={{ opacity: [0.18, 0.3, 0.18], scale: [1, 1.22, 1] }}
              transition={{
                duration: 4 + (i % 4), // 4–7s, deterministic spread
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
                delay: (i % 5) * 0.6, // 0–2.4s staggered
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
