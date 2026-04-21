import { getTranslations, getLocale } from "next-intl/server";
import ExperienceCard from "./ExperienceCard";
import type { Engagement } from "@/types/content";

const ExperienceSection = async () => {
  const t = await getTranslations("experience");
  const locale = await getLocale();

  const engagements = t.raw("engagements") as Engagement[];
  const employmentTypes = t.raw("employmentTypes") as {
    fulltime: string;
    contract: string;
    internship: string;
  };

  return (
    <section id="experience" className="section">
      <div className="section__inner">
        <header className="mb-20">
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
              viewDetail={t.raw("viewDetail") as string}
              locale={locale}
              workHrefBase={`/${locale}/work`}
              employmentTypes={employmentTypes}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
