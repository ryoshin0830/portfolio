"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  m,
  useReducedMotion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  animate,
  type MotionValue,
} from "framer-motion";
import { useInView } from "react-intersection-observer";

/**
 * Layered feedforward-network treatment for the hero recall metric.
 *
 * The metric IS an ASR (speech-recognition neural network) recall number, so a
 * layered net that "computes" it is thematically honest.
 *
 * Interaction model — the pointer FEEDS the model (it does NOT move the artwork):
 *   • the cursor's vertical position excites the nearest INPUT neuron (left),
 *   • when the selected input changes, a deterministic forward-propagation
 *     cascade fires left→right along one path to the OUTPUT (right, beside the
 *     89.72% number).
 *   • no pointer (touch) / idle → the same cascade auto-fires periodically.
 *   • prefers-reduced-motion → fully static.
 *
 * - Geometry DETERMINISTIC (module-scope, no random/Date) → SSR-safe.
 * - Colors are CSS vars → light/dark auto-adapt, no JS theme read, no flash.
 * - Manifesto: hairlines + flat accent + opacity/scale motion only.
 *   No gradient/blur/glow/shadow; no animating cx/cy/r or the whole network.
 */

type Props = {
  value: string;
  unit: string;
  label: string;
  context?: string;
};

/* ----------------------------- geometry ----------------------------- */
const VIEW_W = 1200;
const VIEW_H = 400;
const LAYER_SIZES = [4, 6, 6, 3] as const;
const LAYER_X = [120, 470, 760, 1090];
const LAST_LAYER = LAYER_SIZES.length - 1;

type GNode = { x: number; y: number; layer: number };
const NODES: GNode[] = [];
LAYER_SIZES.forEach((size, layer) => {
  const gap = VIEW_H / (size + 1);
  for (let i = 0; i < size; i++) {
    NODES.push({ x: LAYER_X[layer], y: gap * (i + 1), layer });
  }
});

const isInput = (n: GNode) => n.layer === 0;
const isOutput = (n: GNode) => n.layer === LAST_LAYER;

const LAYER_START: number[] = [];
{
  let acc = 0;
  for (const s of LAYER_SIZES) {
    LAYER_START.push(acc);
    acc += s;
  }
}
const INPUT_NODE_INDICES = NODES.map((_, i) => i).filter((i) => NODES[i].layer === 0);

// Thinned connections: each node links to ~2 nodes in the next layer
// (deterministic stride) — avoids a hairball and keeps the centre sparse.
type GEdge = { from: number; to: number; layer: number };
const EDGES: GEdge[] = [];
for (let l = 0; l < LAST_LAYER; l++) {
  const sizeA = LAYER_SIZES[l];
  const sizeB = LAYER_SIZES[l + 1];
  for (let a = 0; a < sizeA; a++) {
    const t1 = (a * 2) % sizeB;
    const t2 = (a * 2 + 1) % sizeB;
    for (const b of new Set([t1, t2])) {
      EDGES.push({ from: LAYER_START[l] + a, to: LAYER_START[l + 1] + b, layer: l });
    }
  }
}

// One deterministic forward path per input neuron: at each layer follow the
// outgoing edge to the lowest-index target. Used for the propagation cascade.
type Path = { nodes: number[]; edges: number[] };
const PATHS: Path[] = INPUT_NODE_INDICES.map((startIdx) => {
  const nodes = [startIdx];
  const edges: number[] = [];
  let cur = startIdx;
  for (let l = 0; l < LAST_LAYER; l++) {
    const candidates = EDGES.map((e, idx) => ({ e, idx })).filter(
      ({ e }) => e.from === cur && e.layer === l,
    );
    if (candidates.length === 0) break;
    candidates.sort((a, b) => a.e.to - b.e.to);
    const chosen = candidates[0];
    edges.push(chosen.idx);
    nodes.push(chosen.e.to);
    cur = chosen.e.to;
  }
  return { nodes, edges };
});

const HOP_STEP = 0.18; // s between successive hops in the cascade
const PULSE_DUR = 0.45;
const AUTO_MS = 3500; // idle / touch auto-fire period

/* ----------------------------- count-up ----------------------------- */
function parseRange(value: string): { from: number; to: number } | null {
  const m1 = value.match(/([\d.]+)\D+([\d.]+)/);
  if (!m1) return null;
  const from = parseFloat(m1[1]);
  const to = parseFloat(m1[2]);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return { from, to };
}

/* --------- input neuron: continuous excitation from cursor Y --------- */
function InputNeuron({
  node,
  smoothY,
  reduce,
}: {
  node: GNode;
  smoothY: MotionValue<number>;
  reduce: boolean | null;
}) {
  const activation = useTransform(smoothY, (y) => {
    const p = Math.max(0, 1 - Math.abs(y - node.y) / 110);
    return p * p;
  });
  const opacity = useTransform(activation, [0, 1], [0.32, 1]);
  const scale = useTransform(activation, [0, 1], [1, 1.18]);

  if (reduce) {
    return <circle cx={node.x} cy={node.y} r={4.5} fill="var(--color-accent)" opacity={0.4} />;
  }
  return (
    <m.circle
      cx={node.x}
      cy={node.y}
      r={4.5}
      fill="var(--color-accent)"
      style={{ opacity, scale, transformBox: "fill-box", transformOrigin: "center" }}
    />
  );
}

export default function HighlightsHeroMetric({ value, unit, label, context }: Props) {
  const reduce = useReducedMotion();
  const [ref, inView] = useInView({ threshold: 0.25, triggerOnce: true });

  const range = useMemo(() => parseRange(value), [value]);
  const canCountUp = range !== null && !reduce;

  const mv = useMotionValue(range ? range.from : 0);
  const [display, setDisplay] = useState(range ? range.to.toFixed(2) : "");
  useMotionValueEvent(mv, "change", (v) => setDisplay(v.toFixed(2)));

  // Cursor → input excitation (vertical position only; network never moves).
  const pointerY = useMotionValue(VIEW_H / 2);
  const smoothY = useSpring(pointerY, { stiffness: 400, damping: 34, mass: 0.4 });

  const [fine, setFine] = useState(false); // fine pointer (mouse) available
  const [activeInput, setActiveInput] = useState(0);
  const [fireKey, setFireKey] = useState(0);
  const activeRef = useRef(0);
  const movedRecentlyRef = useRef(false);

  useEffect(() => {
    setFine(window.matchMedia?.("(pointer: fine)").matches ?? false);
  }, []);

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!fine || reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    const svgY = ((e.clientY - r.top) / r.height) * VIEW_H;
    pointerY.set(svgY);
    movedRecentlyRef.current = true;

    let best = activeRef.current;
    let bestD = Infinity;
    INPUT_NODE_INDICES.forEach((nodeIdx, inputIdx) => {
      const d = Math.abs(svgY - NODES[nodeIdx].y);
      if (d < bestD) {
        bestD = d;
        best = inputIdx;
      }
    });
    if (best !== activeRef.current) {
      // hysteresis: only switch when clearly closer (avoids edge flicker)
      const curD = Math.abs(svgY - NODES[INPUT_NODE_INDICES[activeRef.current]].y);
      if (bestD + 20 < curD) {
        activeRef.current = best;
        setActiveInput(best);
        setFireKey((k) => k + 1);
      }
    }
  };

  // Count up once, when scrolled into view.
  useEffect(() => {
    if (!canCountUp || !inView || !range) return;
    const controls = animate(mv, range.to, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [canCountUp, inView, mv, range]);

  // Idle / touch auto-fire: cycle the inputs so the net keeps "inferring".
  // Skips a tick if the user moved the pointer recently (so it doesn't fight
  // the cursor-driven cascade).
  useEffect(() => {
    if (reduce || !inView) return;
    const id = window.setInterval(() => {
      if (movedRecentlyRef.current) {
        movedRecentlyRef.current = false;
        return;
      }
      const next = (activeRef.current + 1) % INPUT_NODE_INDICES.length;
      activeRef.current = next;
      setActiveInput(next);
      setFireKey((k) => k + 1);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [reduce, inView]);

  /* number: "82.26% → " static prefix + counting tail */
  const renderNumber = () => {
    if (!range) {
      return (
        <>
          {value}
          {unit && (
            <span
              className="text-[color:var(--color-ink-soft)]"
              style={{ fontSize: "0.4em", fontWeight: 500, marginLeft: "0.15em" }}
            >
              {unit}
            </span>
          )}
        </>
      );
    }
    return (
      <>
        {`${range.from.toFixed(2)}% → ${display}%`}
        {unit && (
          <span
            className="text-[color:var(--color-ink-soft)]"
            style={{ fontSize: "0.4em", fontWeight: 500, marginLeft: "0.15em" }}
          >
            {unit}
          </span>
        )}
      </>
    );
  };

  const ariaValue = range
    ? `${range.from.toFixed(2)}% to ${range.to.toFixed(2)}%`
    : value;

  const activePath = PATHS[activeInput];

  return (
    <div
      ref={ref}
      className="relative mb-20"
      onPointerMove={onMove}
    >
      {/* ---------- fixed network band (decorative) ---------- */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 flex items-center justify-center"
      >
        <svg
          className="h-[155%] w-full"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
          fill="none"
        >
          {/* base edges — neutral hairlines, draw in on scroll, then static */}
          {EDGES.map((e, i) => {
            const a = NODES[e.from];
            const b = NODES[e.to];
            const common = {
              x1: a.x,
              y1: a.y,
              x2: b.x,
              y2: b.y,
              stroke: "var(--color-rule)",
              strokeWidth: 1.25,
              strokeOpacity: 0.2,
              vectorEffect: "non-scaling-stroke" as const,
            };
            if (reduce) return <line key={i} {...common} />;
            return (
              <m.line
                key={i}
                {...common}
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{
                  duration: 0.6,
                  ease: "easeOut",
                  delay: e.layer * 0.2 + (i % 6) * 0.02,
                }}
              />
            );
          })}

          {/* base nodes — inputs (accent, cursor-excited), hidden (neutral),
              outputs (accent). */}
          {NODES.map((n, i) => {
            if (isInput(n)) {
              return <InputNeuron key={i} node={n} smoothY={smoothY} reduce={reduce} />;
            }
            const accent = isOutput(n);
            const fill = accent ? "var(--color-accent)" : "var(--color-ink-muted)";
            const op = accent ? 0.5 : 0.4;
            const r = accent ? 4.5 : 3.5;
            if (reduce) {
              return <circle key={i} cx={n.x} cy={n.y} r={r} fill={fill} opacity={op} />;
            }
            return (
              <m.circle
                key={i}
                cx={n.x}
                cy={n.y}
                r={r}
                fill={fill}
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: op, scale: 1 } : { opacity: 0, scale: 0 }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                transition={{ duration: 0.4, ease: "easeOut", delay: n.layer * 0.2 + 0.15 }}
              />
            );
          })}

          {/* ---------- forward-propagation cascade (re-fires on fireKey) ---------- */}
          {!reduce && inView && (
            <g key={fireKey}>
              {/* edge highlights + traveling pulses, hop by hop */}
              {activePath.edges.map((edgeIdx, hop) => {
                const e = EDGES[edgeIdx];
                const a = NODES[e.from];
                const b = NODES[e.to];
                const delay = hop * HOP_STEP;
                return (
                  <Fragment key={`hop-${hop}`}>
                    <m.line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="var(--color-accent)"
                      strokeWidth={1.5}
                      vectorEffect="non-scaling-stroke"
                      initial={{ strokeOpacity: 0 }}
                      animate={{ strokeOpacity: [0, 0.6, 0] }}
                      transition={{ duration: PULSE_DUR + 0.15, delay, ease: "easeOut" }}
                    />
                    <m.circle
                      cx={a.x}
                      cy={a.y}
                      r={3.5}
                      fill="var(--color-accent)"
                      initial={{ x: 0, y: 0, opacity: 0 }}
                      animate={{ x: [0, b.x - a.x], y: [0, b.y - a.y], opacity: [0, 0.95, 0] }}
                      transition={{ duration: PULSE_DUR, delay, ease: "easeInOut" }}
                    />
                  </Fragment>
                );
              })}

              {/* node flashes as the signal arrives (skip the input node) */}
              {activePath.nodes.map((nodeIdx, k) => {
                if (k === 0) return null; // input already excited by the cursor
                const n = NODES[nodeIdx];
                const out = isOutput(n);
                const delay = (k - 1) * HOP_STEP + PULSE_DUR * 0.7;
                return (
                  <m.circle
                    key={`flash-${k}`}
                    cx={n.x}
                    cy={n.y}
                    r={out ? 5 : 4}
                    fill="var(--color-accent)"
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{
                      opacity: [0, out ? 1 : 0.85, 0],
                      scale: [1, out ? 1.5 : 1.3, 1],
                    }}
                    transition={{ duration: 0.55, delay, ease: "easeOut" }}
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* ---------- number / label / context ---------- */}
      <div className="relative z-10">
        <p
          className="display num mb-6"
          aria-label={ariaValue}
          style={{
            fontSize: "clamp(4rem, 13vw, 10rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.05em",
            color: "var(--color-accent)",
          }}
        >
          <span aria-hidden="true">{renderNumber()}</span>
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">{label}</h2>
        {context && (
          <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl mx-auto">
            {context}
          </p>
        )}
      </div>
    </div>
  );
}
