"use client";

import { useTranslations } from "next-intl";
import { m } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Plane } from "lucide-react";

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

// Location sequence aligned with ja.json timelineEvents (10 entries)
const LOC_SEQ: Loc[] = [
  "china", // 1997 誕生
  "japan", // 1999 来日
  "china", // 2009 中国帰国
  "japan", // 2010 永住
  "china", // 2016 大学入学
  "japan", // 2021 再来日
  "japan", // 2021 修士
  "japan", // 2023 EastLinker
  "japan", // 2023 博士
  "japan", // 2026 GMO ペパボ
];

/**
 * Decorative flight transition rendered inside the arriving event's <li>.
 * Marked aria-hidden so screen readers skip the ornament but still read
 * the year / title / description of the event itself.
 */
function FlightTransition({
  from,
  to,
  fromLabel,
  toLabel,
  delay = 0,
}: {
  from: Loc;
  to: Loc;
  fromLabel: string;
  toLabel: string;
  delay?: number;
}) {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });
  const flipPlane = from === "japan" && to === "china";

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="mb-4 md:mb-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-[6rem_1fr] gap-2 md:gap-12">
        <div className="hidden md:block" />
        <div className="relative overflow-hidden py-4 md:py-6">
          <div className="flex items-center gap-4 md:gap-6">
            <m.div
              initial={{ opacity: 0, x: -8 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
              transition={{ duration: 0.4, delay }}
              className="flex items-center gap-2 shrink-0"
            >
              <span
                className="text-2xl md:text-3xl leading-none"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
              >
                {flagFor[from]}
              </span>
              <span className="text-sm md:text-base font-semibold text-[color:var(--color-ink)]">
                {fromLabel}
              </span>
            </m.div>

            <div className="relative flex-1 min-w-0 h-10 md:h-12">
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 400 40"
                preserveAspectRatio="none"
                focusable="false"
              >
                <m.path
                  d="M 4 20 Q 200 2, 396 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray="4 6"
                  className="text-[color:var(--color-accent)]"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={
                    inView
                      ? { pathLength: 1, opacity: 0.6 }
                      : { pathLength: 0, opacity: 0 }
                  }
                  transition={{ duration: 1.2, delay: delay + 0.15, ease: "easeInOut" }}
                />
              </svg>

              <m.div
                className="absolute top-1/2 -translate-y-1/2"
                initial={{ left: "0%", opacity: 0 }}
                animate={
                  inView
                    ? { left: "calc(100% - 28px)", opacity: 1 }
                    : { left: "0%", opacity: 0 }
                }
                transition={{ duration: 1.5, delay: delay + 0.2, ease: "easeInOut" }}
              >
                <m.span
                  className="inline-flex text-[color:var(--color-accent)]"
                  style={{
                    transform: flipPlane ? "scaleX(-1) rotate(-8deg)" : "rotate(8deg)",
                  }}
                  animate={{ y: [0, -4, 0, -2, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Plane size={28} strokeWidth={2} fill="currentColor" />
                </m.span>
              </m.div>
            </div>

            <m.div
              initial={{ opacity: 0, x: 8 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 8 }}
              transition={{ duration: 0.4, delay: delay + 1.0 }}
              className="flex items-center gap-2 shrink-0"
            >
              <span className="text-sm md:text-base font-semibold text-[color:var(--color-ink)]">
                {toLabel}
              </span>
              <span
                className="text-2xl md:text-3xl leading-none"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
              >
                {flagFor[to]}
              </span>
            </m.div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TimelineSection = () => {
  const t = useTranslations("about");
  const tLoc = useTranslations("locations");
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true });

  const events = t.raw("timelineEvents") as TimelineEvent[];

  return (
    <ol ref={ref} className="relative">
      {events.map((event, i) => {
        const loc = LOC_SEQ[i];
        const prev = i > 0 ? LOC_SEQ[i - 1] : null;
        const transition =
          prev && loc && prev !== loc ? { from: prev, to: loc } : null;

        return (
          <m.li
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.4, delay: 0.04 * i }}
            className="border-t border-[color:var(--color-rule-soft)] first:border-t-0"
          >
            {transition && (
              <FlightTransition
                from={transition.from}
                to={transition.to}
                fromLabel={tLoc(transition.from)}
                toLabel={tLoc(transition.to)}
                delay={0.05 * i}
              />
            )}
            <div className="grid grid-cols-1 md:grid-cols-[6rem_1fr] gap-2 md:gap-12 py-5">
              <div className="flex md:flex-col items-baseline md:items-start gap-2">
                <span className="num text-base font-semibold text-[color:var(--color-accent)]">
                  {event.year}
                </span>
                {loc && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-[color:var(--color-ink-muted)] font-medium">
                    <span className="text-sm leading-none" aria-hidden="true">
                      {flagFor[loc]}
                    </span>
                    {tLoc(loc)}
                  </span>
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
          </m.li>
        );
      })}
    </ol>
  );
};

export default TimelineSection;
