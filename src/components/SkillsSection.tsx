import { getTranslations } from "next-intl/server";

type Skill = { name: string; level: number };

const skillCategories: Array<{ titleKey: string; skills: Skill[] }> = [
  {
    titleKey: "programming",
    skills: [
      { name: "JavaScript", level: 95 },
      { name: "TypeScript", level: 90 },
      { name: "Python", level: 85 },
      { name: "Swift", level: 80 },
    ],
  },
  {
    titleKey: "frontend",
    skills: [
      { name: "React", level: 95 },
      { name: "Next.js", level: 90 },
      { name: "React Native", level: 85 },
    ],
  },
  {
    titleKey: "backend",
    skills: [
      { name: "Node.js", level: 90 },
      { name: "Django", level: 85 },
    ],
  },
  {
    titleKey: "database",
    skills: [
      { name: "MongoDB", level: 90 },
      { name: "MariaDB", level: 85 },
    ],
  },
  {
    titleKey: "cloud",
    skills: [
      { name: "AWS", level: 85 },
      { name: "Google Cloud", level: 80 },
      { name: "Vercel", level: 90 },
    ],
  },
  {
    titleKey: "ai",
    skills: [
      { name: "PyTorch", level: 85 },
      { name: "TensorFlow", level: 80 },
    ],
  },
];

const SkillsSection = async () => {
  const t = await getTranslations("skills");

  const languages = [
    {
      name: t("languageProficiency.japanese"),
      level: 100,
      description: t("languageProficiency.japaneseLevel"),
    },
    {
      name: t("languageProficiency.chinese"),
      level: 100,
      description: t("languageProficiency.chineseLevel"),
    },
    {
      name: t("languageProficiency.english"),
      level: 75,
      description: t("languageProficiency.englishLevel"),
    },
  ];

  const certifications = t.raw("certifications") as {
    title: string;
    subtitle: string;
    list: Array<{
      name: string;
      description: string;
      date: string;
      featured: boolean;
    }>;
  };

  return (
    <section id="skills" className="py-24 bg-[color:var(--color-paper)]">
      <div className="container mx-auto px-6 sm:px-10 max-w-5xl">
        <header className="mb-16">
          <p className="meta mb-3">{t("technicalExpertise")}</p>
          <h2 className="text-3xl sm:text-4xl text-[color:var(--color-ink)]">
            §&nbsp; {t("title")}
          </h2>
        </header>

        <dl className="divide-y divide-[color:var(--color-rule-soft)]">
          {skillCategories.map((category) => (
            <div
              key={category.titleKey}
              className="grid grid-cols-1 sm:grid-cols-[14rem_1fr] gap-2 sm:gap-8 py-6"
            >
              <dt className="headline-italic text-xl sm:text-2xl text-[color:var(--color-ink)] leading-tight">
                {t(category.titleKey)}
              </dt>
              <dd className="text-[color:var(--color-ink)] leading-[1.7]">
                {category.skills.map((skill, i) => (
                  <span key={skill.name}>
                    {skill.name}
                    <span className="meta ml-1 align-baseline">
                      {skill.level}
                    </span>
                    {i < category.skills.length - 1 && (
                      <span aria-hidden="true" className="mx-2 text-[color:var(--color-ink-soft)]">
                        ·
                      </span>
                    )}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-24">
          <p className="meta mb-3">{certifications.subtitle}</p>
          <h3 className="text-2xl sm:text-3xl text-[color:var(--color-ink)] mb-8">
            {certifications.title}
          </h3>

          <ul className="divide-y divide-[color:var(--color-rule-soft)]">
            {certifications.list.map((cert, index) => (
              <li
                key={index}
                className="grid grid-cols-1 sm:grid-cols-[8rem_1fr] gap-1 sm:gap-8 py-5"
              >
                <span className="meta self-start">{cert.date}</span>
                <div>
                  <p className="text-lg text-[color:var(--color-ink)]">
                    {cert.name}
                  </p>
                  <p className="text-sm text-[color:var(--color-ink-soft)] mt-1 leading-relaxed">
                    {cert.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-24">
          <p className="meta mb-3">{t("proficiency")}</p>
          <h3 className="text-2xl sm:text-3xl text-[color:var(--color-ink)] mb-8">
            {t("languages")}
          </h3>

          <dl className="divide-y divide-[color:var(--color-rule-soft)]">
            {languages.map((lang) => (
              <div
                key={lang.name}
                className="grid grid-cols-1 sm:grid-cols-[8rem_1fr_auto] items-baseline gap-2 sm:gap-8 py-5"
              >
                <dt className="headline-italic text-xl text-[color:var(--color-ink)]">
                  {lang.name}
                </dt>
                <dd className="text-[color:var(--color-ink-soft)] leading-relaxed">
                  {lang.description}
                </dd>
                <span className="meta justify-self-start sm:justify-self-end">
                  {lang.level}
                </span>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
