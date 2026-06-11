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
  details: string;
}

interface ExperienceCardProps {
  engagement: Engagement;
  index: number;
  currentBadge: string;
  labels: Labels;
  scopePhases: Record<ScopePhase, string>;
  teamFormat: string;
  orgFormat: string;
  soloFormat: string;
  locale: string;
  employmentTypes: { fulltime: string; contract: string; internship: string };
}

// One meta-label spec for the whole site (.meta in globals.css) — the previous
// per-component uppercase/tracking variants splintered the label system.
const SECTION_LABEL_CLASS = "meta mb-4";
const META_LABEL_CLASS = "meta mb-1";

// All six delivery phases in lifecycle order — the segment bar renders every
// phase and fills only the owned ones, so coverage reads as a shape, not a
// pile of chips.
const ALL_PHASES: ScopePhase[] = [
  "req",
  "basicDesign",
  "detailDesign",
  "impl",
  "test",
  "ops",
];

export default function ExperienceCard({
  engagement: e,
  index,
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

  // Engagements with no scope/stack/achievement data yet (e.g. a job that just
  // started) collapse to a compact row — the full template's reserved padding
  // around an empty body read as an unfinished page.
  const isLean =
    e.scope.length === 0 &&
    e.stack.length === 0 &&
    e.achievements.length === 0 &&
    e.responsibilities.length === 0 &&
    e.workItems.length === 0;

  return (
    <article
      className={`border-t border-[color:var(--color-rule-soft)] ${
        isLean ? "py-10 md:py-12" : "py-14 md:py-20"
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-[12rem_1fr] gap-6 md:gap-16">
        {/* Period column — led by an editorial ordinal. The big rule-colored
            numeral gives each card an identity in the rail without competing
            with content (same big-number language as Highlights/Research). */}
        <div>
          <p
            aria-hidden
            className={`num font-bold tracking-tight leading-none text-[color:var(--color-rule)] ${
              isLean ? "text-3xl mb-3" : "text-5xl md:text-6xl mb-5"
            }`}
          >
            {String(index + 1).padStart(2, "0")}
          </p>
          {/* keep-all: CJK dates break only at the spaces around the dash,
              never inside 「2026年1月」 */}
          <p className="text-base text-[color:var(--color-ink)] num font-medium [word-break:keep-all]">
            {period}
          </p>
          <p className="text-sm text-[color:var(--color-ink-soft)] mt-3">
            {employmentTypes[e.employmentType]}
          </p>
        </div>

        {/* Body */}
        <div>
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
            {e.product}
            {e.isCurrent && (
              <span className="ml-3 text-sm font-medium text-[color:var(--color-accent)] align-middle">
                · {currentBadge}
              </span>
            )}
          </h3>
          <p
            className={`text-base text-[color:var(--color-ink-soft)] ${
              isLean ? "mb-6" : "mb-10"
            }`}
          >
            {e.company} · {e.industry}
          </p>

          {/* Hero achievement */}
          {heroAchievement && (
            <p className="text-xl md:text-2xl font-medium leading-[1.5] text-[color:var(--color-ink)] max-w-3xl mb-12">
              {heroAchievement}
            </p>
          )}

          {/* Role + Team — 2 column meta */}
          <dl
            className={`grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 max-w-2xl ${
              isLean ? "" : "mb-12"
            }`}
          >
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

          {/* Scope phases — segment bar over the full lifecycle (owned = accent) */}
          {e.scope.length > 0 && (
            <div className="mb-12 max-w-3xl">
              <p className={SECTION_LABEL_CLASS}>{labels.scope}</p>
              <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-6">
                {ALL_PHASES.map((p) => {
                  const owned = e.scope.includes(p);
                  return (
                    <div key={p}>
                      <div
                        className={`h-1 rounded-full ${
                          owned
                            ? "bg-[color:var(--color-accent)]"
                            : "bg-[color:var(--color-rule)]"
                        }`}
                      />
                      <p
                        className={`mt-2 text-xs leading-tight ${
                          owned
                            ? "font-medium text-[color:var(--color-ink)]"
                            : "text-[color:var(--color-ink-muted)]"
                        }`}
                      >
                        {scopePhases[p]}
                      </p>
                    </div>
                  );
                })}
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
            <hr className="border-t border-[color:var(--color-rule-soft)] my-12" />
          )}

          {/* Remaining achievements (hero lifted out) — outcomes stay visible */}
          {restAchievements.length > 0 && (
            <div className="mb-10">
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

          {/* Responsibilities + work items — folded by default. The long
              per-engagement bullet lists were the page's heaviest text walls;
              a native <details> keeps them one tap away with zero JS. */}
          {(e.responsibilities.length > 0 || e.workItems.length > 0) && (
            <details className="group max-w-3xl">
              <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-base font-medium text-[color:var(--color-accent)] [&::-webkit-details-marker]:hidden">
                <svg
                  aria-hidden
                  viewBox="0 0 12 12"
                  className="h-3 w-3 shrink-0 transition-transform group-open:rotate-90"
                >
                  <path
                    d="M4 2l4 4-4 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {labels.details}
              </summary>

              <div className="space-y-10 pt-10">
                {e.responsibilities.length > 0 && (
                  <div>
                    <p className={SECTION_LABEL_CLASS}>{labels.responsibilities}</p>
                    <ul className="space-y-2 text-base text-[color:var(--color-ink)]">
                      {e.responsibilities.map((r, j) => (
                        <li key={j} className="flex gap-3">
                          <span className="text-[color:var(--color-accent)] shrink-0">·</span>
                          <span className="leading-relaxed break-words min-w-0">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {e.workItems.length > 0 && (
                  <div>
                    <p className={SECTION_LABEL_CLASS}>{labels.workItems}</p>
                    <ul className="space-y-2 text-base text-[color:var(--color-ink)]">
                      {e.workItems.map((w, j) => (
                        <li key={j} className="flex gap-3">
                          <span className="text-[color:var(--color-accent)] shrink-0">·</span>
                          <span className="leading-relaxed break-words min-w-0">{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </article>
  );
}
