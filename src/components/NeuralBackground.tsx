"use client";

import { m } from "framer-motion";
import { useActiveAnimation } from "@/hooks/useActiveAnimation";

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
 *
 * TWO layouts, picked by CSS (no JS, no hydration mismatch):
 * - Landscape (≥768px): wide viewBox, the hero is roughly viewport-shaped.
 * - Portrait (<768px): the hero is very tall and narrow (the activity feed
 *   stretches it to ~1900px). A wide viewBox + `slice` would crop ~85% of the
 *   graph away, leaving stray hairlines (the bug this fixes). A tall viewBox
 *   keeps `slice` height-driven, so the full vertical run shows with only a
 *   gentle horizontal centre-crop — a believable network at any phone height.
 */

// ── Landscape graph — viewBox 0 0 1200 800 ──────────────────────────────────
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

const EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
  [0, 8], [1, 9], [2, 10], [3, 10], [4, 11], [5, 12], [6, 13], [7, 14],
  [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14],
  [8, 15], [9, 16], [10, 17], [11, 18], [12, 19],
];

const ACCENT_NODES = new Set<number>([3, 10, 17]);

// ── Portrait graph — viewBox 0 0 360 1200 ───────────────────────────────────
// Nodes run the full height in a loose 3-column zigzag, so the centre band that
// `slice` keeps on a narrow phone always reads as a connected network.
const NODES_P: ReadonlyArray<{ cx: number; cy: number }> = [
  { cx: 180, cy: 60 }, // 0
  { cx: 70, cy: 150 }, // 1
  { cx: 290, cy: 170 }, // 2
  { cx: 160, cy: 270 }, // 3
  { cx: 300, cy: 330 }, // 4
  { cx: 60, cy: 360 }, // 5
  { cx: 200, cy: 430 }, // 6
  { cx: 90, cy: 520 }, // 7
  { cx: 300, cy: 540 }, // 8
  { cx: 180, cy: 600 }, // 9
  { cx: 70, cy: 690 }, // 10
  { cx: 290, cy: 710 }, // 11
  { cx: 170, cy: 790 }, // 12
  { cx: 300, cy: 880 }, // 13
  { cx: 80, cy: 900 }, // 14
  { cx: 200, cy: 970 }, // 15
  { cx: 90, cy: 1070 }, // 16
  { cx: 290, cy: 1080 }, // 17
  { cx: 180, cy: 1150 }, // 18
];

const EDGES_P: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [0, 2], [0, 3], [1, 3], [2, 4], [3, 4], [3, 6], [1, 5],
  [5, 7], [4, 8], [6, 8], [6, 9], [7, 9], [7, 10], [8, 11], [9, 11],
  [9, 12], [10, 12], [11, 13], [12, 13], [12, 14], [13, 15], [14, 15],
  [14, 16], [15, 17], [15, 16], [16, 18], [17, 18],
];

const ACCENT_NODES_P = new Set<number>([0, 9, 17]);

function Graph({
  nodes,
  edges,
  accent,
  active,
}: {
  nodes: ReadonlyArray<{ cx: number; cy: number }>;
  edges: ReadonlyArray<readonly [number, number]>;
  accent: Set<number>;
  active: boolean;
}) {
  return (
    <>
      {/* Edges: static hairlines, neutral, very low opacity */}
      {edges.map(([a, b], i) => {
        const n1 = nodes[a];
        const n2 = nodes[b];
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
      {nodes.map((n, i) => {
        const fill = accent.has(i)
          ? "var(--color-accent)"
          : "var(--color-ink-muted)";

        if (!active) {
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
    </>
  );
}

export default function NeuralBackground() {
  // Pause the infinite loops when the hero is off-screen, the tab is hidden,
  // or the user prefers reduced motion. The hero is full-screen, so threshold 0
  // keeps the breathing alive while any sliver is visible and tears it down
  // (framer-motion → plain <circle>, zero RAF) the moment it fully leaves.
  const { ref, active } = useActiveAnimation({ threshold: 0 });

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-0"
    >
      {/* Portrait — phones. A tall viewBox keeps `slice` height-driven so the
          whole graph runs the full height of the very tall mobile hero. */}
      <svg
        className="block h-full w-full md:hidden"
        viewBox="0 0 360 1200"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <Graph nodes={NODES_P} edges={EDGES_P} accent={ACCENT_NODES_P} active={active} />
      </svg>

      {/* Landscape — tablets and up, where the hero is roughly viewport-shaped. */}
      <svg
        className="hidden h-full w-full md:block"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <Graph nodes={NODES} edges={EDGES} accent={ACCENT_NODES} active={active} />
      </svg>
    </div>
  );
}
