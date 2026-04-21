"use client";

import { useTranslations } from "next-intl";
import { m } from "framer-motion";
import { useInView } from "react-intersection-observer";

const TimelineSection = () => {
  const t = useTranslations("about");
  const tLoc = useTranslations("locations");
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true });

  const timelineEvents = t.raw("timelineEvents") as Array<{
    year: string;
    title: string;
    description: string;
    icon?: string;
  }>;

  // Map index → location heuristic (matches existing data pattern)
  const locForIndex = (i: number, icon?: string): "china" | "japan" | undefined => {
    const seq: Array<"china" | "japan" | undefined> = [
      "china", "japan", "china", "japan", "china", "japan", "japan", "japan", "japan", "japan",
    ];
    if (icon === "plane") return seq[i];
    return seq[i];
  };

  return (
    <div ref={ref} className="border-t border-[color:var(--color-rule-soft)] pt-6">
      <ol className="relative">
        {timelineEvents.map((event, i) => {
          const loc = locForIndex(i, event.icon);
          return (
            <m.li
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: 0.4, delay: 0.04 * i }}
              className="grid grid-cols-1 md:grid-cols-[8rem_1fr] gap-2 md:gap-12 border-b border-[color:var(--color-rule-soft)] py-5"
            >
              <div className="flex md:flex-col items-baseline md:items-start gap-2">
                <span className="font-mono num text-[15px] tracking-wider text-[color:var(--color-amber-mark)]">
                  {event.year}
                </span>
                {loc && (
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink-soft)] font-mono">
                    {tLoc(loc)}
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-semibold tracking-tight text-xl text-[color:var(--color-ink)] leading-tight mb-1">
                  {event.title}
                </h4>
                <p className="text-sm leading-relaxed text-[color:var(--color-ink-soft)] max-w-[60ch]">
                  {event.description}
                </p>
              </div>
            </m.li>
          );
        })}
      </ol>
    </div>
  );
};

export default TimelineSection;
