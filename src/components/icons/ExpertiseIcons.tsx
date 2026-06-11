import type { Expertise } from "@/types/content";

// Hairline line icons for the three expertise cards. Hand-drawn SVG (not
// generated imagery) so the stroke weight stays consistent with the rest of
// the system; stroke uses currentColor, so dark mode is automatic.
const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function ExpertiseIcon({
  id,
  className,
}: {
  id: Expertise["id"];
  className?: string;
}) {
  switch (id) {
    case "web":
      // Code brackets — web engineering.
      return (
        <svg viewBox="0 0 32 32" aria-hidden className={className}>
          <path d="M11 9l-7 7 7 7" {...STROKE} />
          <path d="M21 9l7 7-7 7" {...STROKE} />
          <path d="M18 6l-4 20" {...STROKE} />
        </svg>
      );
    case "ml":
      // Sparse node lattice — the neural-net motif used elsewhere on the site.
      return (
        <svg viewBox="0 0 32 32" aria-hidden className={className}>
          <circle cx="6" cy="16" r="2.25" {...STROKE} />
          <circle cx="17" cy="7" r="2.25" {...STROKE} />
          <circle cx="17" cy="25" r="2.25" {...STROKE} />
          <circle cx="27" cy="16" r="2.25" {...STROKE} />
          <path d="M8 14.5L15 8.5M8 17.5l7 6M19 8.5l6.2 6M19 23.5l6.2-6" {...STROKE} />
        </svg>
      );
    case "language-edu":
      // Speech bubble with text lines — language education.
      return (
        <svg viewBox="0 0 32 32" aria-hidden className={className}>
          <path
            d="M27 6H5v16h6v5l6-5h10V6z"
            {...STROKE}
          />
          <path d="M10 12h12M10 16h8" {...STROKE} />
        </svg>
      );
  }
}
