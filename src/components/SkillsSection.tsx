import { getTranslations } from "next-intl/server";
import type { SkillCategory } from "@/types/content";

const SkillsSection = async () => {
  const t = await getTranslations("skills");

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

  // Show certifications newest-first (JSON order is unsorted → dates jumped around).
  const certList = [...certifications.list].sort(
    (a, b) => (parseInt(b.date, 10) || 0) - (parseInt(a.date, 10) || 0),
  );

  // Skill display is flat per category — proficiency brackets hide the forest
  // for the trees. The page's job is to show what was used, not to grade it.
  return (
    <section id="skills" className="section">
      <div className="section__inner">
        <header className="mb-12 md:mb-16">
          <h2 className="display display--lg mb-6">{t("title")}</h2>
          <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl">
            {t("subtitle")}
          </p>
        </header>

        {/* Categories — one row per category, all chips flat */}
        <div className="space-y-14">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-4 md:gap-16"
            >
              <h3 className="text-xl md:text-2xl font-semibold tracking-tight">
                {t(cat.titleKey)}
              </h3>
              <div className="flex flex-wrap gap-2 items-start">
                {cat.items.map((item) => (
                  <span key={item.name} className="chip">
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Languages */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-4 md:gap-16">
          <h3 className="text-xl md:text-2xl font-semibold tracking-tight">
            {t("languages")}
          </h3>
          <ul className="space-y-3">
            {languages.map((l) => (
              <li key={l.name} className="flex flex-wrap items-baseline gap-x-4">
                <span className="text-lg font-semibold">{l.name}</span>
                <span className="text-base text-[color:var(--color-ink-soft)]">
                  {l.level}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Certifications — ruled rows (same editorial register as the
            publication lists): no orphaned grid cells, and a driver's licence
            row no longer gets the same card weight as a perfect-score JLPT. */}
        <div className="mt-20">
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-8">
            {certifications.title}
          </h3>
          <ul>
            {certList.map((c) => (
              <li
                key={`${c.date}-${c.name}`}
                className="grid grid-cols-1 gap-1 border-t border-[color:var(--color-rule-soft)] py-4 last:border-b last:border-[color:var(--color-rule-soft)] md:grid-cols-[6rem_minmax(0,20rem)_1fr] md:items-baseline md:gap-8"
              >
                <p className="num text-sm text-[color:var(--color-accent)] font-semibold">
                  {c.date}
                </p>
                <h4 className="text-base font-semibold tracking-tight">
                  {c.name}
                </h4>
                <p className="text-sm text-[color:var(--color-ink-soft)] leading-relaxed">
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
