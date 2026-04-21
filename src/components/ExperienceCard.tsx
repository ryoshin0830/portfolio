"use client";

import { useId, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { Engagement, ScopePhase } from "@/types/content";
import { formatPeriod, durationMonths, formatDuration, isLocale } from "@/lib/formatPeriod";

interface Labels {
  role: string;
  team: string;
  stack: string;
  scope: string;
  responsibilities: string;
  workItems: string;
  achievements: string;
  industry: string;
  employment: string;
}

interface ExperienceCardProps {
  index: number;
  engagement: Engagement;
  labels: Labels;
  scopePhases: Record<ScopePhase, string>;
  employmentTypes: { fulltime: string; contract: string; internship: string };
  teamFormat: string;
  soloFormat: string;
  viewDetail: string;
  locale: string;
  workHrefBase: string;
}

export default function ExperienceCard({
  index,
  engagement: e,
  labels,
  scopePhases,
  employmentTypes,
  teamFormat,
  soloFormat,
  viewDetail,
  locale,
  workHrefBase,
}: ExperienceCardProps) {
  const [open, setOpen] = useState(false);
  const headingId = useId();
  const panelId = useId();

  const loc = isLocale(locale) ? locale : "ja";
  const period = formatPeriod(e.start, e.end, loc);
  const months = durationMonths(e.start, e.end);
  const dur = formatDuration(months, loc);

  const team =
    e.teamOverall != null && e.teamSection != null
      ? teamFormat
          .replace("{overall}", String(e.teamOverall))
          .replace("{section}", String(e.teamSection))
      : soloFormat;

  const featuredAchievements = e.achievements.slice(0, 2);

  return (
    <article className="border-t border-[color:var(--color-rule)]">
      <div className="grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-4 md:gap-12 py-8">
        {/* Period gutter */}
        <div className="space-y-2">
          <div className="kicker num text-[color:var(--color-amber-mark)]">
            № {String(index + 1).padStart(2, "0")}
          </div>
          <div className="font-mono text-[12px] num text-[color:var(--color-ink)] tracking-wider">
            {period}
          </div>
          <div className="font-mono text-[11px] num text-[color:var(--color-ink-soft)]">
            {dur}
          </div>
          <div>
            <span className="tag-mono">
              {employmentTypes[e.employmentType]}
            </span>
          </div>
        </div>

        {/* Body */}
        <div>
          <div className="flex items-baseline gap-3 flex-wrap mb-1">
            <h3 className="font-semibold tracking-tight text-2xl md:text-3xl leading-tight text-[color:var(--color-ink)]">
              {e.product}
            </h3>
            {e.isCurrent && (
              <span className="text-xs font-mono uppercase tracking-[0.18em] text-[color:var(--color-amber-mark)]">
                · current
              </span>
            )}
          </div>
          <p className="text-sm text-[color:var(--color-ink-soft)] mb-4">
            {e.company} · {e.industry}
          </p>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
            <div className="flex gap-3 border-t border-[color:var(--color-rule-soft)] pt-2">
              <dt className="kicker shrink-0 w-20">{labels.role}</dt>
              <dd>{e.role}</dd>
            </div>
            <div className="flex gap-3 border-t border-[color:var(--color-rule-soft)] pt-2">
              <dt className="kicker shrink-0 w-20">{labels.team}</dt>
              <dd className="font-mono num text-[13px]">{team}</dd>
            </div>
          </dl>

          {/* Tech stack */}
          <div className="mb-5">
            <div className="kicker mb-2">{labels.stack}</div>
            <div className="flex flex-wrap gap-1.5">
              {e.stack.map((s) => (
                <span key={s} className="tag-mono">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Featured achievements (always visible) */}
          {featuredAchievements.length > 0 && (
            <div className="mb-5">
              <div className="kicker mb-2">{labels.achievements}</div>
              <ul className="space-y-1.5 text-sm">
                {featuredAchievements.map((a, j) => (
                  <li key={j} className="flex gap-2 text-[color:var(--color-ink)]">
                    <span className="text-[color:var(--color-amber-mark)] shrink-0">→</span>
                    <span className="leading-relaxed">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Toggle + permalink row */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              id={headingId}
              onClick={() => setOpen((v) => !v)}
              className="focus-edit inline-flex items-center gap-2 text-sm font-mono uppercase tracking-[0.12em] text-[color:var(--color-ink)] hover:text-[color:var(--color-amber-mark)] transition-colors"
            >
              <ChevronDown
                size={14}
                className="transition-transform"
                style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
              />
              <span>{open ? "Close" : labels.workItems + " · " + labels.responsibilities}</span>
            </button>
            <Link
              href={`${workHrefBase}/${e.id}`}
              className="focus-edit text-sm font-mono uppercase tracking-[0.12em] text-[color:var(--color-amber-mark)] hover:underline underline-offset-4"
            >
              {viewDetail} →
            </Link>
          </div>

          <AnimatePresence initial={false}>
            {open && (
              <m.div
                key="panel"
                id={panelId}
                role="region"
                aria-labelledby={headingId}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 text-sm">
                  <Section label={labels.responsibilities} items={e.responsibilities} />
                  <Section label={labels.workItems} items={e.workItems} />
                  <div>
                    <div className="kicker mb-2">{labels.scope}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {e.scope.map((p) => (
                        <span key={p} className="tag-mono">
                          {scopePhases[p]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </article>
  );
}

function Section({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="kicker mb-2">{label}</div>
      <ul className="space-y-1.5 text-[color:var(--color-ink)]">
        {items.map((i, idx) => (
          <li key={idx} className="flex gap-2">
            <span className="text-[color:var(--color-rule-soft)] shrink-0">·</span>
            <span className="leading-relaxed">{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
