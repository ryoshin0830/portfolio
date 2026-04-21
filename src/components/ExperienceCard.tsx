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
  engagement: Engagement;
  viewDetail: string;
  currentBadge: string;
  labels: Labels;
  scopePhases: Record<ScopePhase, string>;
  teamFormat: string;
  soloFormat: string;
  locale: string;
  workHrefBase: string;
  employmentTypes: { fulltime: string; contract: string; internship: string };
}

export default function ExperienceCard({
  engagement: e,
  viewDetail,
  currentBadge,
  labels,
  scopePhases,
  teamFormat,
  soloFormat,
  locale,
  workHrefBase,
  employmentTypes,
}: ExperienceCardProps) {
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

  return (
    <article className="border-t border-[color:var(--color-rule-soft)] py-12 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-[12rem_1fr] gap-6 md:gap-16">
        {/* Period column */}
        <div>
          <p className="text-base text-[color:var(--color-ink)] num font-medium">
            {period}
          </p>
          <p className="text-sm text-[color:var(--color-ink-muted)] num mt-1">
            {dur}
          </p>
          <p className="text-sm text-[color:var(--color-ink-soft)] mt-3">
            {employmentTypes[e.employmentType]}
          </p>
        </div>

        {/* Body */}
        <div>
          <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            {e.product}
            {e.isCurrent && (
              <span className="ml-3 text-sm font-medium text-[color:var(--color-accent)] align-middle">
                · {currentBadge}
              </span>
            )}
          </h3>
          <p className="text-base text-[color:var(--color-ink-soft)] mb-8">
            {e.company} · {e.industry}
          </p>

          {/* Role + Team — 2 column meta */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 mb-10 max-w-2xl">
            <div>
              <dt className="text-sm font-medium text-[color:var(--color-ink-muted)] mb-1">
                {labels.role}
              </dt>
              <dd className="text-base text-[color:var(--color-ink)]">{e.role}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[color:var(--color-ink-muted)] mb-1">
                {labels.team}
              </dt>
              <dd className="text-base text-[color:var(--color-ink)] num">{team}</dd>
            </div>
          </dl>

          {/* Scope phases */}
          {e.scope.length > 0 && (
            <div className="mb-8">
              <p className="text-sm font-medium text-[color:var(--color-ink-muted)] mb-3">
                {labels.scope}
              </p>
              <div className="flex flex-wrap gap-2">
                {e.scope.map((p) => (
                  <span key={p} className="chip">
                    {scopePhases[p]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stack — all chips */}
          {e.stack.length > 0 && (
            <div className="mb-8">
              <p className="text-sm font-medium text-[color:var(--color-ink-muted)] mb-3">
                {labels.stack}
              </p>
              <div className="flex flex-wrap gap-2">
                {e.stack.map((s) => (
                  <span key={s} className="chip">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Responsibilities */}
          {e.responsibilities.length > 0 && (
            <div className="mb-8">
              <p className="text-sm font-medium text-[color:var(--color-ink-muted)] mb-3">
                {labels.responsibilities}
              </p>
              <ul className="space-y-2 text-base text-[color:var(--color-ink)] max-w-3xl">
                {e.responsibilities.map((r, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="text-[color:var(--color-accent)] shrink-0">·</span>
                    <span className="leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Work items */}
          {e.workItems.length > 0 && (
            <div className="mb-8">
              <p className="text-sm font-medium text-[color:var(--color-ink-muted)] mb-3">
                {labels.workItems}
              </p>
              <ul className="space-y-2 text-base text-[color:var(--color-ink)] max-w-3xl">
                {e.workItems.map((w, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="text-[color:var(--color-accent)] shrink-0">·</span>
                    <span className="leading-relaxed">{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Achievements — all */}
          {e.achievements.length > 0 && (
            <div className="mb-10">
              <p className="text-sm font-medium text-[color:var(--color-ink-muted)] mb-3">
                {labels.achievements}
              </p>
              <ul className="space-y-3 text-base text-[color:var(--color-ink)] max-w-3xl">
                {e.achievements.map((a, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="text-[color:var(--color-accent)] shrink-0">→</span>
                    <span className="leading-relaxed font-medium">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link href={`${workHrefBase}/${e.id}`} className="link-accent text-base">
            {viewDetail}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
