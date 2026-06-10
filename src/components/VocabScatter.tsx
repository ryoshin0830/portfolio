// Static Word2Vec-style scatter diagram for the vocabulary-question project —
// a sister piece to the Highlights neural-net SVG. Deterministic coordinates
// (module-scope constants, SSR-safe), colors via CSS variables so dark mode is
// automatic, and no animation: it renders once and costs nothing.

// Background cloud — "the vocabulary space". Hand-placed in loose clusters so
// the density reads organic rather than uniform.
const CLOUD: ReadonlyArray<readonly [number, number, number]> = [
  // [x, y, r]
  [38, 52, 3], [62, 88, 2], [84, 40, 4], [108, 96, 2.5], [126, 58, 3],
  [70, 150, 2], [44, 196, 3.5], [92, 178, 2.5], [120, 214, 2], [60, 244, 3],
  [150, 132, 2], [168, 76, 2.5], [196, 44, 3], [228, 70, 2], [206, 108, 2.5],
  [252, 50, 3.5], [286, 84, 2], [310, 44, 2.5], [338, 72, 3], [368, 52, 2],
  [398, 90, 3], [424, 60, 2.5], [442, 110, 2], [410, 150, 3], [436, 196, 2.5],
  [380, 236, 3], [414, 262, 2], [344, 256, 2.5], [300, 272, 3], [256, 258, 2],
  [148, 262, 2.5], [188, 240, 2], [104, 134, 2],
];

// The query word and its nearest neighbours in embedding space — the blue
// constellation the project actually computes.
const CENTER = [236, 168] as const;
const NEIGHBORS: ReadonlyArray<readonly [number, number, number]> = [
  [186, 122, 4], [296, 130, 4.5], [318, 196, 4], [206, 216, 4.5], [262, 92, 3.5],
];

export default function VocabScatter({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 320"
      aria-hidden
      className={className}
    >
      {/* vocabulary cloud */}
      <g fill="var(--color-ink-muted)" opacity="0.4">
        {CLOUD.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>

      {/* nearest-neighbour links */}
      <g stroke="var(--color-accent)" strokeWidth="1" opacity="0.5">
        {NEIGHBORS.map(([x, y], i) => (
          <line key={i} x1={CENTER[0]} y1={CENTER[1]} x2={x} y2={y} />
        ))}
      </g>

      {/* neighbours */}
      <g fill="var(--color-accent)" opacity="0.75">
        {NEIGHBORS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>

      {/* query word */}
      <circle
        cx={CENTER[0]}
        cy={CENTER[1]}
        r="7"
        fill="var(--color-accent)"
      />
      <circle
        cx={CENTER[0]}
        cy={CENTER[1]}
        r="13"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1"
        opacity="0.45"
      />
    </svg>
  );
}
