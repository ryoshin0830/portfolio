import type { Engagement, ScopePhase } from "@/types/content";
import { formatPeriod, isLocale } from "@/lib/formatPeriod";

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
  currentBadge: string;
  labels: Labels;
  scopePhases: Record<ScopePhase, string>;
  teamFormat: string;
  orgFormat: string;
  soloFormat: string;
  locale: string;
  employmentTypes: { fulltime: string; contract: string; internship: string };
}

const LABEL_BASE =
  "text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--color-ink-muted)]";
const SECTION_LABEL_CLASS = `${LABEL_BASE} mb-4`;
const META_LABEL_CLASS = `${LABEL_BASE} mb-1`;

export default function ExperienceCard({
  engagement: e,
  currentBadge,
  labels,
  scopePhases,
  teamFormat,
  orgFormat,
  soloFormat,
  locale,
  employmentTypes,
}: ExperienceCardProps) {
  const loc = isLocale(locale) ? locale : "ja";
  const period = formatPeriod(e.start, e.end, loc);
  const team =
    e.teamOverall != null && e.teamSection != null
      ? teamFormat
          .replace("{overall}", String(e.teamOverall))
          .replace("{section}", String(e.teamSection))
      : e.teamOverall != null
        ? orgFormat.replace("{overall}", String(e.teamOverall))
        : soloFormat;

  const [heroAchievement, ...restAchievements] = e.achievements;

  return (
    <article className="border-t border-[color:var(--color-rule-soft)] py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-[12rem_1fr] gap-6 md:gap-16">
        {/* Period column */}
        <div>
          <p className="text-base text-[color:var(--color-ink)] num font-medium">
            {period}
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
          <p className="text-base text-[color:var(--color-ink-soft)] mb-10">
            {e.company} · {e.industry}
          </p>

          {/* Hero achievement */}
          {heroAchievement && (
            <p className="text-xl md:text-2xl font-medium leading-[1.5] text-[color:var(--color-ink)] max-w-3xl mb-14">
              {heroAchievement}
            </p>
          )}

          {/* Role + Team — 2 column meta */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 mb-12 max-w-2xl">
            <div>
              <dt className={META_LABEL_CLASS}>
                {labels.role}
              </dt>
              <dd className="text-base text-[color:var(--color-ink)]">{e.role}</dd>
            </div>
            <div>
              <dt className={META_LABEL_CLASS}>
                {labels.team}
              </dt>
              <dd className="text-base text-[color:var(--color-ink)] num">{team}</dd>
            </div>
          </dl>

          {/* Scope phases */}
          {e.scope.length > 0 && (
            <div className="mb-12">
              <p className={SECTION_LABEL_CLASS}>{labels.scope}</p>
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
            <div className="mb-12">
              <p className={SECTION_LABEL_CLASS}>{labels.stack}</p>
              <div className="flex flex-wrap gap-2">
                {e.stack.map((s) => (
                  <span key={s} className="chip">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Divider between factual meta and narrative */}
          {(e.responsibilities.length > 0 ||
            e.workItems.length > 0 ||
            restAchievements.length > 0) && (
            <hr className="border-t border-[color:var(--color-rule-soft)] my-14" />
          )}

          {/* Responsibilities */}
          {e.responsibilities.length > 0 && (
            <div className="mb-12">
              <p className={SECTION_LABEL_CLASS}>{labels.responsibilities}</p>
              <ul className="space-y-2 text-base text-[color:var(--color-ink)] max-w-3xl">
                {e.responsibilities.map((r, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="text-[color:var(--color-accent)] shrink-0">·</span>
                    <span className="leading-relaxed break-words min-w-0">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Work items */}
          {e.workItems.length > 0 && (
            <div className="mb-12">
              <p className={SECTION_LABEL_CLASS}>{labels.workItems}</p>
              <ul className="space-y-2 text-base text-[color:var(--color-ink)] max-w-3xl">
                {e.workItems.map((w, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="text-[color:var(--color-accent)] shrink-0">·</span>
                    <span className="leading-relaxed break-words min-w-0">{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Remaining achievements (hero lifted out) */}
          {restAchievements.length > 0 && (
            <div>
              <p className={SECTION_LABEL_CLASS}>{labels.achievements}</p>
              <ul className="space-y-3 text-base text-[color:var(--color-ink)] max-w-3xl">
                {restAchievements.map((a, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="text-[color:var(--color-accent)] shrink-0">→</span>
                    <span className="leading-relaxed font-medium break-words min-w-0">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
