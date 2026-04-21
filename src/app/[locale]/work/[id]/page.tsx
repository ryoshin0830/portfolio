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

  const folio = `Vol. ${String(idx + 1).padStart(2, "0")}`;
  const heroAchievement = e.achievements[0];
  const restAchievements = e.achievements.slice(1);

  // JSON-LD WorkExperience-equivalent (using Person + hasOccupation reference)
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
    <main className="bg-[color:var(--color-paper)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-5xl px-6 lg:px-10 pt-32 pb-24">
        {/* Masthead */}
        <header className="border-b border-[color:var(--color-rule)] pb-6 mb-12 flex items-baseline justify-between flex-wrap gap-3">
          <div className="kicker num">
            {folio} — {e.product}
          </div>
          <div className="kicker num">{period}</div>
        </header>

        {/* Title block */}
        <div className="mb-12">
          <p className="kicker text-[color:var(--color-amber-mark)] mb-3">
            {employmentTypes[e.employmentType]} · {e.industry}
          </p>
          <h1 className="display display--xxl mb-6">{e.product}</h1>
          <p className="font-serif italic text-2xl text-[color:var(--color-ink-soft)]">
            {e.company}
          </p>
        </div>

        {/* Pull-quote — the hero metric */}
        {heroAchievement && (
          <blockquote className="my-16 border-l-4 border-[color:var(--color-amber-mark)] pl-8 max-w-[60ch]">
            <p className="font-serif italic text-3xl md:text-4xl leading-tight text-[color:var(--color-ink)]">
              “{heroAchievement}”
            </p>
            <footer className="kicker mt-4">— Outcome</footer>
          </blockquote>
        )}

        {/* Marginalia + body in 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-x-12 gap-y-8 border-t border-[color:var(--color-rule)] pt-10">
          {/* Marginalia (left) */}
          <aside className="md:sticky md:top-24 self-start space-y-6 text-sm">
            <Marginalia label={labels.role} value={e.role} />
            <Marginalia label={labels.team} value={team} mono />
            <Marginalia label="Period" value={`${period} · ${dur}`} mono />
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
            <div>
              <div className="kicker mb-2">{labels.stack}</div>
              <div className="flex flex-wrap gap-1.5">
                {e.stack.map((s) => (
                  <span key={s} className="tag-mono">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          {/* Body (right) */}
          <div className="space-y-12 max-w-[68ch]">
            <Section label={labels.responsibilities} items={e.responsibilities} />
            <Section label={labels.workItems} items={e.workItems} />
            {restAchievements.length > 0 && (
              <div>
                <div className="kicker mb-3">{labels.achievements}</div>
                <ul className="space-y-3 text-base">
                  {restAchievements.map((a, i) => (
                    <li key={i} className="flex gap-3 text-[color:var(--color-ink)]">
                      <span className="text-[color:var(--color-amber-mark)] shrink-0">→</span>
                      <span className="leading-relaxed">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer nav */}
        <nav className="mt-20 border-t border-[color:var(--color-rule)] pt-6 flex items-baseline justify-between flex-wrap gap-3">
          <Link
            href={`/${validLocale}#experience`}
            className="focus-edit text-sm font-mono uppercase tracking-[0.12em] text-[color:var(--color-ink)] hover:text-[color:var(--color-amber-mark)]"
          >
            ← All engagements
          </Link>
          <div className="kicker num">{folio}</div>
        </nav>
      </article>
    </main>
  );
}

function Marginalia({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="kicker mb-1">{label}</div>
      <div
        className={
          mono
            ? "font-mono text-[13px] num text-[color:var(--color-ink)] leading-relaxed"
            : "text-[color:var(--color-ink)] leading-relaxed"
        }
      >
        {value}
      </div>
    </div>
  );
}

function Section({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="kicker mb-3">{label}</div>
      <ul className="space-y-3 text-base">
        {items.map((i, idx) => (
          <li key={idx} className="flex gap-3 text-[color:var(--color-ink)]">
            <span className="text-[color:var(--color-amber-mark)] shrink-0 font-mono num text-sm">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span className="leading-relaxed">{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
