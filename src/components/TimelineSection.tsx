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

// Location sequence aligned with ja.json timelineEvents.
// Physical relocations (used to pick plane fly-in direction):
//   1997 CN → 1999 JP (#1 来日)
//   1999 JP → 2009 CN (#2 中国帰国)
//   2016 CN → 2021 JP (#3 再来日)
// 2010 永住許可取得 was granted remotely while resident in China.
const LOC_SEQ: Loc[] = [
  "china", // 1997 誕生（北京）
  "japan", // 1999 来日
  "china", // 2009 中国帰国
  "china", // 2010 永住許可取得（中国滞在中）
  "china", // 2016 大学入学（北京）
  "japan", // 2021 再来日
  "japan", // 2021 修士課程入学
  "japan", // 2023 修士課程修了
  "japan", // 2023 博士課程入学
  "japan", // 2023 国立国語研究所プロジェクト
  "japan", // 2025 medimo
  "japan", // 2025 ニュージーランド大学プロジェクト（SUIREN）
  "japan", // 2026 Sapeet
  "japan", // 2026 博士課程修了
  "japan", // 2026 GMO ペパボ
];

const TimelineSection = () => {
  const t = useTranslations("about");
  const tLoc = useTranslations("locations");
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true });

  const events = t.raw("timelineEvents") as TimelineEvent[];

  return (
    <ol ref={ref} className="relative">
      {events.map((event, i) => {
        const loc = LOC_SEQ[i];
        const isPlaneEvent = event.icon === "plane";

        return (
          <m.li
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.4, delay: 0.04 * i }}
            className="border-t border-[color:var(--color-rule-soft)] first:border-t-0"
          >
            {isPlaneEvent && (
              <div
                aria-hidden="true"
                className="flex justify-center pt-10 md:pt-14 pb-2"
              >
                <m.div
                  className="relative"
                  initial={{
                    x: loc === "japan" ? -180 : 180,
                    y: -20,
                    opacity: 0,
                  }}
                  whileInView={{ x: 0, y: 0, opacity: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 1.4, type: "spring" }}
                >
                  <m.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Plane
                      className="text-[color:var(--color-accent)] w-10 h-10 md:w-11 md:h-11"
                      strokeWidth={1.5}
                    />
                  </m.div>
                  <m.div
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-accent)] opacity-70" />
                  </m.div>
                </m.div>
              </div>
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
