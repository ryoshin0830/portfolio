import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Engagement, ScopePhase } from "@/types/content";
import {
  formatPeriod,
  durationMonths,
  formatDuration,
  isLocale,
} from "@/lib/formatPeriod";

const ENGAGEMENT_IDS = [
  "gmo-pepabo",
  "sapeet",
  "medimo",
  "ninjal",
  "ml-vocab",
  "corpus-maker",
  "lands",
  "shinhan",
] as const;

const LOCALES = ["ja", "en", "zh"] as const;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    ENGAGEMENT_IDS.map((id) => ({ locale, id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const validLocale = isLocale(locale) ? locale : "ja";
  const t = await getTranslations({ locale: validLocale, namespace: "experience" });
  const engagements = t.raw("engagements") as Engagement[];
  const e = engagements.find((x) => x.id === id);
  if (!e) return {};
  const period = formatPeriod(e.start, e.end, validLocale);
  return {
    title: `${e.product} — ${e.company} | ${period}`,
    description: e.achievements[0] ?? e.role,
    openGraph: {
      title: `${e.product} — ${e.company}`,
      description: e.achievements[0] ?? e.role,
      type: "article",
    },
  };
}

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const validLocale = isLocale(locale) ? locale : "ja";
  setRequestLocale(validLocale);

  const t = await getTranslations({ locale: validLocale, namespace: "experience" });
  const engagements = t.raw("engagements") as Engagement[];
  const idx = engagements.findIndex((x) => x.id === id);
  if (idx === -1) notFound();
  const e = engagements[idx];

  const labels = t.raw("labels") as {
    role: string;
    team: string;
    stack: string;
    scope: string;
    responsibilities: string;
    workItems: string;
    achievements: string;
    industry: string;
    employment: string;
  };
  const scopePhases = t.raw("scopePhases") as Record<ScopePhase, string>;
  const employmentTypes = t.raw("employmentTypes") as {
    fulltime: string;
    contract: string;
    internship: string;
  };
  const teamFormat = t.raw("teamFormat") as string;
  const soloFormat = t.raw("soloFormat") as string;

  const period = formatPeriod(e.start, e.end, validLocale);
  const months = durationMonths(e.start, e.end);
  const dur = formatDuration(months, validLocale);
  const team =
    e.teamOverall != null && e.teamSection != null
      ? teamFormat
          .replace("{overall}", String(e.teamOverall))
          .replace("{section}", String(e.teamSection))
      : soloFormat;

  const heroAchievement = e.achievements[0];
  const restAchievements = e.achievements.slice(1);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${e.product} — ${e.company}`,
    description: heroAchievement,
    author: { "@type": "Person", name: "梁震 (Ryo Shin)", url: "https://ryosh.in" },
    datePublished: e.start,
    keywords: e.stack.join(", "),
  };

  return (
    <main className="bg-[color:var(--color-bg)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-4xl px-6 lg:px-10 pt-32 pb-32">
        {/* Period + employment */}
        <p className="text-sm text-[color:var(--color-ink-soft)] num mb-6">
          {period} · {dur} · {employmentTypes[e.employmentType]}
        </p>

        {/* Title */}
        <h1 className="display display--xl mb-6">{e.product}</h1>
        <p className="text-xl md:text-2xl text-[color:var(--color-ink-soft)] mb-16">
          {e.company} · {e.industry}
        </p>

        {/* Hero achievement */}
        {heroAchievement && (
          <p className="prose-body text-[color:var(--color-ink)] max-w-3xl mb-20" style={{ fontSize: "1.375rem", lineHeight: 1.5 }}>
            {heroAchievement}
          </p>
        )}

        {/* Meta block */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20 max-w-3xl">
          <div>
            <p className="text-sm font-medium text-[color:var(--color-ink-muted)] mb-2">
              {labels.role}
            </p>
            <p className="text-base text-[color:var(--color-ink)]">{e.role}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-[color:var(--color-ink-muted)] mb-2">
              {labels.team}
            </p>
            <p className="text-base text-[color:var(--color-ink)] num">{team}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-[color:var(--color-ink-muted)] mb-2">
              {labels.scope}
            </p>
            <p className="text-base text-[color:var(--color-ink)]">
              {e.scope.map((p) => scopePhases[p]).join(" · ")}
            </p>
          </div>
        </div>

        {/* Stack */}
        <div className="mb-20">
          <p className="text-sm font-medium text-[color:var(--color-ink-muted)] mb-4">
            {labels.stack}
          </p>
          <div className="flex flex-wrap gap-2">
            {e.stack.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-16 max-w-3xl">
          <Section label={labels.responsibilities} items={e.responsibilities} />
          <Section label={labels.workItems} items={e.workItems} />
          {restAchievements.length > 0 && (
            <Section label={labels.achievements} items={restAchievements} />
          )}
        </div>

        <nav className="mt-24 pt-8 border-t border-[color:var(--color-rule-soft)]">
          <Link
            href={`/${validLocale}#experience`}
            className="link-accent text-base"
          >
            <span aria-hidden>←</span>
            {t.raw("backToList") as string}
          </Link>
        </nav>
      </article>
    </main>
  );
}

function Section({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
        {label}
      </h2>
      <ul className="space-y-3">
        {items.map((i, idx) => (
          <li key={idx} className="flex gap-3 text-base text-[color:var(--color-ink)]">
            <span className="text-[color:var(--color-accent)] shrink-0">·</span>
            <span className="leading-relaxed">{i}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
