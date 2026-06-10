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

  // Group skills by proficiency instead of showing cryptic "5y" badges / an
  // unexplained blue accent. Tier is derived from the existing data: featured
  // skills are "core", anything with ≥3 years is "proficient", the rest are
  // "familiar". The tier label carries the meaning; chips stay monochrome.
  type SkillItem = SkillCategory["items"][number];
  const levelOf = (i: SkillItem): "core" | "proficient" | "familiar" =>
    i.featured ? "core" : (i.years ?? 0) >= 3 ? "proficient" : "familiar";
  const tiers = [
    { key: "core", label: t("levelCore") },
    { key: "proficient", label: t("levelProficient") },
    { key: "familiar", label: t("levelFamiliar") },
  ] as const;

  return (
    <section id="skills" className="section">
      <div className="section__inner">
        <header className="mb-20">
          <p className="meta text-[color:var(--color-accent)] mb-3">{t("kicker")}</p>
          <h2 className="display display--xl mb-6">{t("title")}</h2>
          <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl">
            {t("subtitle")}
          </p>
        </header>

        {/* Categories */}
        <div className="space-y-16">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-4 md:gap-16"
            >
              <h3 className="text-xl md:text-2xl font-semibold tracking-tight">
                {t(cat.titleKey)}
              </h3>
              <div className="space-y-5 min-w-0">
                {tiers.map((tier) => {
                  const items = cat.items.filter(
                    (i) => levelOf(i) === tier.key,
                  );
                  if (items.length === 0) return null;
                  return (
                    <div
                      key={tier.key}
                      className="grid grid-cols-1 sm:grid-cols-[7rem_1fr] gap-2 sm:gap-6"
                    >
                      <span className="text-sm text-[color:var(--color-ink-muted)] pt-1.5">
                        {tier.label}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {items.map((item) => (
                          <span
                            key={item.name}
                            className={`chip ${tier.key === "core" ? "chip--core" : ""}`}
                          >
                            {item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Languages */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-4 md:gap-16">
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

        {/* Certifications */}
        <div className="mt-24">
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-10">
            {certifications.title}
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
            {certList.map((c) => (
              <li key={`${c.date}-${c.name}`}>
                <p className="num text-sm text-[color:var(--color-accent)] font-semibold mb-1">
                  {c.date}
                </p>
                <h4 className="text-lg font-semibold tracking-tight mb-1">
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
