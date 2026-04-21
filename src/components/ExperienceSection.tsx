import { getTranslations, getLocale } from "next-intl/server";
import ExperienceCard from "./ExperienceCard";
import type { Engagement, ScopePhase } from "@/types/content";

const ExperienceSection = async () => {
  const t = await getTranslations("experience");
  const tBadges = await getTranslations("badges");
  const locale = await getLocale();

  const engagements = t.raw("engagements") as Engagement[];
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

  if (process.env.NODE_ENV !== "production") {
    if (engagements.length !== 8) {
      console.warn(
        `[ExperienceSection] Expected 8 engagements, got ${engagements.length} for locale ${locale}`,
      );
    }
  }

  return (
    <section id="experience" className="section section--rule">
      <div className="section__inner">
        <header className="border-b border-[color:var(--color-rule)] pb-6 mb-10">
          <div className="kicker mb-3">{tBadges("professionalExperience")}</div>
          <h2 className="display display--xl">{t("title")}</h2>
          <p className="mt-4 max-w-2xl text-base text-[color:var(--color-ink-soft)]">
            {t("subtitle")}
          </p>
          <p className="mt-3 max-w-2xl text-sm text-[color:var(--color-ink-soft)]">
            {t("intro")}
          </p>
        </header>

        <div>
          {engagements.map((e, i) => (
            <ExperienceCard
              key={e.id}
              index={i}
              engagement={e}
              labels={labels}
              scopePhases={scopePhases}
              employmentTypes={employmentTypes}
              teamFormat={t.raw("teamFormat") as string}
              soloFormat={t.raw("soloFormat") as string}
              viewDetail={t.raw("viewDetail") as string}
              locale={locale}
              workHrefBase={`/${locale}/work`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
