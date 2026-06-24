"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { m, useReducedMotion, useScroll } from "framer-motion";
import { useInView } from "react-intersection-observer";

type TimelineEvent = {
  year: string;
  title: string;
  description: string;
  icon?: string;
};

type Loc = "china" | "japan";

const flagFor: Record<Loc, string> = {
  china: "🇨🇳",
  japan: "🇯🇵",
};

// Location per row. Relocations (icon "plane") fly from the previous row's
// country to this row's country.
const LOC_SEQ: Loc[] = [
  "china", // 1997 誕生（北京）
  "japan", // 1999 来日
  "china", // 2009 中国帰国
  "china", // 2010 永住許可取得
  "china", // 2016 大学入学
  "china", // 2020 大学卒業
  "japan", // 2021 再来日
  "japan", // 2021 修士課程入学
  "japan", // 2023 修士課程修了
  "japan", // 2023 博士課程入学
  "japan", // 2023 国立国語研究所プロジェクト
  "japan", // 2025 medimo
  "japan", // 2025 Massey University（SUIREN）
  "japan", // 2026 Sapeet
  "japan", // 2026 博士課程修了
  "japan", // 2026 GMO ペパボ（ロリポップ レンタルサーバー）
];

const RAIL_X = 11; // px — the spine's horizontal centre
const NODE_TOP = 33; // px — node position inside a row (aligned to the year)

// A top-view airplane silhouette pointing UP; we rotate it 180° so it noses
// straight DOWN — the timeline's direction of travel (forward in time).
const PLANE_UP_D =
  "M12 2 C12.55 2 13 2.7 13 3.9 L13 9 L21 13.6 L21 15.3 L13 13 L13 18.6 L16 20.6 L16 21.7 L12 20.7 L8 21.7 L8 20.6 L11 18.6 L11 13 L3 15.3 L3 13.6 L11 9 L11 3.9 C11 2.7 11.45 2 12 2 Z";

/**
 * A dot on the spine that fills with accent the instant it crosses the
 * viewport's vertical centre — the line the accent rail draws to. Reverses on
 * scroll-up so it always matches the drawn rail.
 */
const SpineDot = ({ reduce }: { reduce: boolean | null }) => {
  const [ref, inView] = useInView({ rootMargin: "9999px 0px -50% 0px" });
  const lit = reduce === true || inView;
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: RAIL_X, top: NODE_TOP }}
    >
      <span className="relative block" style={{ width: 7, height: 7 }}>
        <span
          className="absolute inset-0 block rounded-full"
          style={{ background: "var(--color-rule)" }}
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

/**
 * A relocation, shown as a VERTICAL flight: the origin country sits on top, the
 * destination below, and an airplane noses straight DOWN the line — matching the
 * timeline's own top-to-bottom flow of time. The contrail draws as it descends.
 * Direction is self-evident: top = from, bottom = to, the plane flies down.
 */
const FlightDown = ({
  from,
  to,
  reduce,
}: {
  from: Loc;
  to: Loc;
  reduce: boolean | null;
}) => {
  const tLoc = useTranslations("locations");
  const [ref, inView] = useInView({
    triggerOnce: true,
    rootMargin: "0px 0px -15% 0px",
  });
  const lit = reduce === true || inView;
  const dur = reduce ? 0 : 1.1;

  const TRACK = 28; // px of vertical travel (compact)

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="flex flex-col items-center gap-1"
      style={{ width: 46 }}
    >
      <span className="text-[11px] font-semibold tracking-[0.06em] text-[color:var(--color-ink-soft)] leading-none">
        {tLoc(from)}
      </span>
      <div className="relative" style={{ width: 18, height: TRACK }}>
        {/* dashed flight path */}
        <span
          className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2"
          style={{
            width: 1,
            backgroundImage:
              "repeating-linear-gradient(var(--color-rule) 0 2px, transparent 2px 6px)",
          }}
        />
        {/* contrail, drawn as the plane descends */}
        <m.span
          className="absolute left-1/2 top-0 -translate-x-1/2 origin-top"
          style={{ width: 1, height: "100%", background: "var(--color-accent)" }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: lit ? 1 : 0 }}
          transition={{ duration: dur, ease: "easeInOut" }}
        />
        {/* the airplane, nosing straight down */}
        <m.span
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: -4 }}
          initial={{ y: reduce ? TRACK - 8 : 0 }}
          animate={{ y: lit ? TRACK - 8 : 0 }}
          transition={{ duration: dur, ease: "easeInOut" }}
        >
          <svg
            width={15}
            height={15}
            viewBox="0 0 24 24"
            className="block"
            style={{ transform: "rotate(180deg)" }}
          >
            <path d={PLANE_UP_D} style={{ fill: "var(--color-accent)" }} />
          </svg>
        </m.span>
      </div>
      <span className="text-[11px] font-semibold tracking-[0.08em] text-[color:var(--color-accent)] leading-none">
        {tLoc(to)}
      </span>
    </div>
  );
};

const TimelineSection = () => {
  const t = useTranslations("about");
  const tLoc = useTranslations("locations");
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

  // End the rail at the last node instead of the list's bottom, so it doesn't
  // dangle into the section padding below the final event.
  const [railH, setRailH] = useState<number | null>(null);
  useEffect(() => {
    const ol = olRef.current;
    if (!ol) return;
    const measure = () => {
      const lis = ol.querySelectorAll<HTMLElement>(":scope > li");
      const last = lis[lis.length - 1];
      if (last) setRailH(last.offsetTop + NODE_TOP);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ol);
    return () => ro.disconnect();
  }, []);

  const events = t.raw("timelineEvents") as TimelineEvent[];

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
          background: "var(--color-rule-soft)",
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
        const loc = LOC_SEQ[i];
        const relocation = event.icon === "plane";
        const from = LOC_SEQ[i - 1] ?? loc;

        return (
          <m.li
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.4, delay: 0.04 * i }}
            className="relative"
          >
            <SpineDot reduce={reduce} />
            <div
              className={`ml-7 md:ml-9 ${
                i > 0 ? "border-t border-[color:var(--color-rule-soft)]" : ""
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-[6rem_1fr] gap-2 md:gap-12 py-5">
                <div
                  className={`flex gap-2 ${
                    relocation
                      ? "flex-col items-start"
                      : "md:flex-col items-baseline md:items-start"
                  }`}
                >
                  <span className="num text-base font-semibold text-[color:var(--color-accent)]">
                    {event.year}
                  </span>
                  {relocation ? (
                    <FlightDown from={from} to={loc} reduce={reduce} />
                  ) : (
                    loc && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-[color:var(--color-ink-muted)] font-medium">
                        <span className="text-sm leading-none" aria-hidden="true">
                          {flagFor[loc]}
                        </span>
                        {tLoc(loc)}
                      </span>
                    )
                  )}
                </div>
                <div>
                  <h4 className="text-lg md:text-xl font-semibold tracking-tight mb-1">
                    {event.title}
                  </h4>
                  <p className="text-base text-[color:var(--color-ink-soft)] leading-relaxed">
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
