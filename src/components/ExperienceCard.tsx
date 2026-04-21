import Link from "next/link";
import type { Engagement } from "@/types/content";
import { formatPeriod, durationMonths, formatDuration, isLocale } from "@/lib/formatPeriod";

interface ExperienceCardProps {
  engagement: Engagement;
  viewDetail: string;
  locale: string;
  workHrefBase: string;
  employmentTypes: { fulltime: string; contract: string; internship: string };
}

export default function ExperienceCard({
  engagement: e,
  viewDetail,
  locale,
  workHrefBase,
  employmentTypes,
}: ExperienceCardProps) {
  const loc = isLocale(locale) ? locale : "ja";
  const period = formatPeriod(e.start, e.end, loc);
  const months = durationMonths(e.start, e.end);
  const dur = formatDuration(months, loc);
  const featured = e.achievements.slice(0, 1);

  return (
    <article className="border-t border-[color:var(--color-rule-soft)] py-12 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-[10rem_1fr] gap-6 md:gap-16">
        {/* Period */}
        <div>
          <p className="text-sm text-[color:var(--color-ink-soft)] num">
            {period}
          </p>
          <p className="text-xs text-[color:var(--color-ink-muted)] num mt-1">
            {dur} · {employmentTypes[e.employmentType]}
          </p>
        </div>

        {/* Body */}
        <div>
          <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            {e.product}
            {e.isCurrent && (
              <span className="ml-3 text-sm font-medium text-[color:var(--color-accent)] align-middle">
                · Current
              </span>
            )}
          </h3>
          <p className="text-base text-[color:var(--color-ink-soft)] mb-6">
            {e.company} · {e.role}
          </p>

          {featured.length > 0 && (
            <p className="prose-body text-[color:var(--color-ink)] mb-8 max-w-2xl">
              {featured[0]}
            </p>
          )}

          <Link
            href={`${workHrefBase}/${e.id}`}
            className="link-accent text-base"
          >
            {viewDetail}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
