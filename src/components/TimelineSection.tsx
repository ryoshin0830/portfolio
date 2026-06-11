"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { m, useReducedMotion, useScroll } from "framer-motion";
import { useInView } from "react-intersection-observer";
import type { TimelineEra, TimelineEvent } from "@/types/content";

/**
 * Life timeline — a chaptered ledger instead of 16 identical rows.
 *
 * Structure (all data-driven from messages/about):
 * - `timelineEras` chapters the life into places (北京 → 横浜 → 北京 → 京都);
 *   each chapter opens with a full-width hairline + "01 北京 · 1997–1999 · 中国"
 *   header. These 3 hairlines replace the previous 15 per-row rules.
 * - `highlight: true` marks turning points (来日 / 帰国 / 再来日 / 博士号 / 就職):
 *   display-size title + larger spine dot. Everything else is a quiet one-liner.
 * - Relocations are told by the chapter break itself plus a "北京 → 横浜" meta
 *   line (the 15px airplane glyph read as a cursor arrow, so it's gone).
 * - Repeated years (2021×2, 2023×3…) render once per run; later rows keep the
 *   year for screen readers only. Accent blue is reserved for scroll progress
 *   (rail + dots) and the route arrows — never for static emphasis.
 */

const RAIL_X = 11; // px — the spine's horizontal centre inside the <ol>

// Row containers are ml-7 (28px) / md:ml-9 (36px), so the dot sits at
// RAIL_X - margin. Vertical centres align with the year line:
// minor: py-3.5 (14px) + text-sm line (20px)/2 = 24; major: py-6 (24px) +
// text-base line (24px)/2 = 36.
const DOT_LEFT = "left-[-17px] md:left-[-25px]";

/**
 * A dot on the spine that fills with accent the instant it crosses the
 * viewport's vertical centre — the line the accent rail draws to. Reverses on
 * scroll-up so it always matches the drawn rail. Turning points get a larger
 * ringed dot (station vs. stop).
 */
const SpineDot = ({
  major,
  reduce,
}: {
  major: boolean;
  reduce: boolean | null;
}) => {
  const [ref, inView] = useInView({ rootMargin: "9999px 0px -50% 0px" });
  const lit = reduce === true || inView;
  const size = major ? 11 : 7;
  return (
    <span
      ref={ref}
      data-spine-dot
      aria-hidden="true"
      className={`absolute -translate-x-1/2 -translate-y-1/2 ${DOT_LEFT} ${
        major ? "top-[36px]" : "top-[24px]"
      }`}
    >
      <span className="relative block" style={{ width: size, height: size }}>
        <span
          className="absolute inset-0 block rounded-full"
          style={
            major
              ? { border: "1.5px solid var(--color-rule)" }
              : { background: "var(--color-rule)" }
          }
        />
        <m.span
          className="absolute inset-0 block rounded-full"
          style={{ background: "var(--color-accent)" }}
          initial={false}
          animate={{ opacity: lit ? 1 : 0, scale: lit ? 1 : 0.5 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </span>
    </span>
  );
};

const TimelineSection = () => {
  const t = useTranslations("about");
  const reduce = useReducedMotion();

  const olRef = useRef<HTMLOListElement>(null);
  const [revealRef, inView] = useInView({ threshold: 0.05, triggerOnce: true });

  // Accent rail front tracks the viewport centre (0 when the list top reaches
  // it, 1 when its bottom does) — matching where the dots light.
  const { scrollYProgress } = useScroll({
    target: olRef,
    offset: ["start center", "end center"],
  });

  const [dynamic, setDynamic] = useState(false);
  useEffect(() => {
    if (!reduce) setDynamic(true);
  }, [reduce]);

  // End the rail at the last node instead of the list's bottom. The dot is
  // measured directly (chapter headers make row offsets vary, so a fixed
  // per-row constant would drift).
  const [railH, setRailH] = useState<number | null>(null);
  useEffect(() => {
    const ol = olRef.current;
    if (!ol) return;
    const measure = () => {
      const lastDot = ol.querySelector<HTMLElement>(
        ":scope > li:last-child [data-spine-dot]",
      );
      if (lastDot) {
        const dotRect = lastDot.getBoundingClientRect();
        const olRect = ol.getBoundingClientRect();
        setRailH(dotRect.top - olRect.top + dotRect.height / 2);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ol);
    return () => ro.disconnect();
  }, []);

  const events = t.raw("timelineEvents") as TimelineEvent[];
  const eras = t.raw("timelineEras") as TimelineEra[];

  return (
    <ol
      ref={(node) => {
        revealRef(node);
        (olRef as React.MutableRefObject<HTMLOListElement | null>).current =
          node;
      }}
      className="relative"
    >
      {/* faint rail + accent fill drawn from the top as you scroll; the rail
          ends at the last node so it doesn't trail into the section padding */}
      <span
        aria-hidden="true"
        className="absolute top-0 -translate-x-1/2"
        style={{
          left: RAIL_X,
          width: 1,
          height: railH ?? "100%",
          background: "var(--color-rule)",
        }}
      />
      <m.span
        aria-hidden="true"
        className="absolute top-0 -translate-x-1/2"
        style={{
          left: RAIL_X,
          width: 1,
          height: railH ?? "100%",
          background: "var(--color-accent)",
          transformOrigin: "top",
          scaleY: dynamic ? scrollYProgress : 1,
        }}
      />

      {events.map((event, i) => {
        const prev = i > 0 ? events[i - 1] : null;
        const era = eras[event.era];
        const eraStart = prev === null || prev.era !== event.era;
        const showYear = eraStart || prev?.year !== event.year;
        const major = event.highlight === true;
        // A chapter that opens mid-life is a relocation — name the route.
        const route =
          eraStart && prev ? { from: eras[prev.era].label, to: era.label } : null;

        return (
          <m.li
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.4, delay: 0.04 * i }}
            className="relative"
          >
            {era && eraStart && (
              <div
                className={`ml-7 md:ml-9 flex flex-wrap items-baseline gap-x-3 pb-4 ${
                  i === 0
                    ? ""
                    : "mt-6 border-t border-[color:var(--color-rule-soft)] pt-8"
                }`}
              >
                <span className="num text-sm font-semibold text-[color:var(--color-ink-muted)]">
                  {String(event.era + 1).padStart(2, "0")}
                </span>
                <span className="text-lg font-semibold tracking-tight">
                  {era.label}
                </span>
                <span className="meta num">
                  {era.period} · {era.country}
                </span>
              </div>
            )}

            <div className={`relative ml-7 md:ml-9 ${major ? "py-6" : "py-3.5"}`}>
              <SpineDot major={major} reduce={reduce} />
              <div className="grid grid-cols-[3.5rem_1fr] gap-4 md:grid-cols-[6rem_1fr] md:gap-12">
                <span
                  className={`num ${
                    major
                      ? "text-base font-semibold text-[color:var(--color-ink)]"
                      : "text-sm font-medium text-[color:var(--color-ink-muted)] pt-0.5"
                  }`}
                >
                  {showYear ? (
                    event.year
                  ) : (
                    <span className="sr-only">{event.year}</span>
                  )}
                </span>
                <div>
                  {route && (
                    <p className="meta mb-2">
                      {route.from}{" "}
                      <span
                        className="text-[color:var(--color-accent)]"
                        aria-hidden="true"
                      >
                        →
                      </span>{" "}
                      {route.to}
                    </p>
                  )}
                  <h4
                    className={
                      major
                        ? "text-xl md:text-2xl font-semibold tracking-tight mb-1.5"
                        : "text-base font-medium tracking-tight mb-0.5"
                    }
                  >
                    {event.title}
                  </h4>
                  <p
                    className={`${
                      major ? "text-base" : "text-sm"
                    } text-[color:var(--color-ink-soft)] leading-relaxed max-w-2xl`}
                  >
                    {event.description}
                  </p>
                </div>
              </div>
            </div>
          </m.li>
        );
      })}
    </ol>
  );
};

export default TimelineSection;
