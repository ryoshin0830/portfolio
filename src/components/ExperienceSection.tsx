import { getTranslations, getLocale } from "next-intl/server";
import ExperienceCard from "./ExperienceCard";
import type { Engagement, ScopePhase } from "@/types/content";

const ExperienceSection = async () => {
  const t = await getTranslations("experience");
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

  return (
    <section id="experience" className="section">
      <div className="section__inner">
        <header className="mb-16">
          <h2 className="display display--xl mb-6">{t("title")}</h2>
          <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl">
            {t("subtitle")}
          </p>
        </header>

        <div>
          {engagements.map((e) => (
            <ExperienceCard
              key={e.id}
              engagement={e}
              currentBadge={t.raw("currentBadge") as string}
              labels={labels}
              scopePhases={scopePhases}
              teamFormat={t.raw("teamFormat") as string}
              orgFormat={t.raw("orgFormat") as string}
              soloFormat={t.raw("soloFormat") as string}
              locale={locale}
              employmentTypes={employmentTypes}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
