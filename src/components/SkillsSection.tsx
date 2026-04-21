import { getTranslations } from "next-intl/server";
import type { SkillCategory } from "@/types/content";

const SkillsSection = async () => {
  const t = await getTranslations("skills");
  const tBadges = await getTranslations("badges");
  const tCommon = await getTranslations("common");

  const categories = t.raw("categories") as SkillCategory[];
  const certifications = t.raw("certifications") as {
    title: string;
    subtitle: string;
    list: Array<{ name: string; description: string; date: string }>;
  };
  const languages = [
    { name: t("languageProficiency.japanese"), level: t("languageProficiency.japaneseLevel") },
    { name: t("languageProficiency.chinese"), level: t("languageProficiency.chineseLevel") },
    { name: t("languageProficiency.english"), level: t("languageProficiency.englishLevel") },
  ];

  void tCommon;

  return (
    <section id="skills" className="section section--rule">
      <div className="section__inner">
        <header className="border-b border-[color:var(--color-rule)] pb-6 mb-12">
          <div className="kicker mb-3">{tBadges("technicalExpertise")}</div>
          <h2 className="display display--xl">{t("title")}</h2>
          <p className="mt-4 max-w-2xl text-base text-[color:var(--color-ink-soft)]">
            {t("subtitle")}
          </p>
        </header>

        {/* Years-of-experience matrix */}
        <div className="space-y-12">
          {categories.map((cat) => (
            <section key={cat.id} className="grid grid-cols-1 md:grid-cols-[12rem_1fr] gap-4 md:gap-12 border-t border-[color:var(--color-rule-soft)] pt-8">
              <div>
                <div className="kicker num mb-2">№ {cat.id.padStart(2, "0").slice(-2)}</div>
                <h3 className="font-semibold tracking-tight text-xl text-[color:var(--color-ink)]">
                  {t(cat.titleKey)}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {cat.items.map((item) => (
                  <span
                    key={item.name}
                    className={`inline-flex items-baseline gap-2 px-3 py-2 border rounded-[2px] ${
                      item.featured
                        ? "border-[color:var(--color-amber-mark)] text-[color:var(--color-ink)]"
                        : "border-[color:var(--color-rule-soft)] text-[color:var(--color-ink)]"
                    }`}
                  >
                    <span className="text-[0.95rem] leading-none">{item.name}</span>
                    {item.years !== undefined && (
                      <span
                        className={`font-mono text-[11px] num leading-none ${
                          item.featured
                            ? "text-[color:var(--color-amber-mark)]"
                            : "text-[color:var(--color-ink-soft)]"
                        }`}
                      >
                        {item.years}
                        {t("yearsLabel")}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Languages */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-[12rem_1fr] gap-4 md:gap-12 border-t border-[color:var(--color-rule)] pt-10">
          <div>
            <div className="kicker mb-2">Languages</div>
            <h3 className="font-semibold tracking-tight text-xl text-[color:var(--color-ink)]">
              {t("languages")}
            </h3>
          </div>
          <ul className="space-y-3">
            {languages.map((l) => (
              <li
                key={l.name}
                className="grid grid-cols-[7rem_1fr] gap-4 items-baseline border-b border-[color:var(--color-rule-soft)] pb-3"
              >
                <span className="font-semibold tracking-tight text-lg text-[color:var(--color-ink)]">
                  {l.name}
                </span>
                <span className="text-sm text-[color:var(--color-ink-soft)]">{l.level}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Certifications */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-[12rem_1fr] gap-4 md:gap-12 border-t border-[color:var(--color-rule)] pt-10">
          <div>
            <div className="kicker mb-2">Certifications</div>
            <h3 className="font-semibold tracking-tight text-xl text-[color:var(--color-ink)]">
              {certifications.title}
            </h3>
            <p className="text-xs text-[color:var(--color-ink-soft)] mt-2">
              {certifications.subtitle}
            </p>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {certifications.list.map((c, i) => (
              <li
                key={i}
                className="border-t border-[color:var(--color-rule-soft)] pt-3"
              >
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="font-semibold tracking-tight text-base text-[color:var(--color-ink)]">
                    {c.name}
                  </span>
                  <span className="font-mono text-[11px] num text-[color:var(--color-ink-soft)] tracking-[0.05em]">
                    {c.date}
                  </span>
                </div>
                <p className="text-xs text-[color:var(--color-ink-soft)] leading-relaxed">
                  {c.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
