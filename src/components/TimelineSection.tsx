"use client";

import { useTranslations } from "next-intl";
import { m } from "framer-motion";
import { useInView } from "react-intersection-observer";

const TimelineSection = () => {
  const t = useTranslations("about");
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true });

  const events = t.raw("timelineEvents") as Array<{
    year: string;
    title: string;
    description: string;
    icon?: string;
  }>;

  return (
    <ol ref={ref} className="space-y-1">
      {events.map((event, i) => (
        <m.li
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.4, delay: 0.04 * i }}
          className="grid grid-cols-1 md:grid-cols-[6rem_1fr] gap-2 md:gap-12 py-5 border-t border-[color:var(--color-rule-soft)]"
        >
          <span className="num text-base font-semibold text-[color:var(--color-accent)]">
            {event.year}
          </span>
          <div>
            <h4 className="text-lg md:text-xl font-semibold tracking-tight mb-1">
              {event.title}
            </h4>
            <p className="text-base text-[color:var(--color-ink-soft)] leading-relaxed">
              {event.description}
            </p>
          </div>
        </m.li>
      ))}
    </ol>
  );
};

export default TimelineSection;
