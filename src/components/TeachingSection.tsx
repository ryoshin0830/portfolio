import { getTranslations } from "next-intl/server";

export default async function TeachingSection() {
  const t = await getTranslations("teaching");

  const stats = [
    { value: "7", label: t("yearsExperience") },
    { value: "5,000+", label: t("teachingHours") },
    { value: "300+", label: t("studentsTotal") },
    { value: "95%", label: t("passRate") },
  ];

  const courses = [
    {
      title: t("courses.basic.title"),
      description: t("courses.basic.description"),
      features: t.raw("courses.basic.features") as string[],
    },
    {
      title: t("courses.jlpt.title"),
      description: t("courses.jlpt.description"),
      features: t.raw("courses.jlpt.features") as string[],
    },
    {
      title: t("courses.business.title"),
      description: t("courses.business.description"),
      features: t.raw("courses.business.features") as string[],
    },
  ];

  return (
    <section id="teaching" className="py-24 bg-[color:var(--color-paper)]">
      <div className="container mx-auto px-6 sm:px-10 max-w-5xl">
        <header className="mb-12">
          <p className="meta">{t("title")}</p>
          <h2 className="headline-italic text-3xl sm:text-4xl text-[color:var(--color-ink)] mt-2 leading-tight max-w-3xl">
            {t("subtitle")}
          </h2>
        </header>

        <div className="border-t border-[color:var(--color-rule)] border-b border-[color:var(--color-rule)] py-10 mb-16">
          <p className="headline-italic text-2xl sm:text-3xl text-[color:var(--color-teal-ink)] mb-2">
            JLPT N1
          </p>
          <p className="text-4xl sm:text-6xl text-[color:var(--color-ink)] headline-italic tracking-tight leading-none">
            180 / 180
          </p>
          <p className="meta mt-3 text-[color:var(--color-ink-soft)]">
            {t("perfectScore")} &mdash; {t("perfectScoreDescription")}
          </p>
        </div>

        <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 mb-20">
          {stats.map((stat) => (
            <div key={stat.label} className="border-t border-[color:var(--color-rule-soft)] pt-4">
              <dt className="meta mb-2">{stat.label}</dt>
              <dd className="headline-italic text-4xl sm:text-5xl text-[color:var(--color-ink)] leading-none">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mb-20">
          <p className="meta mb-2">{t("experienceTitle")}</p>
          <h3 className="headline-italic text-2xl sm:text-3xl text-[color:var(--color-ink)] mb-6">
            {t("newOriental")}
          </h3>
          <p className="text-[color:var(--color-ink)] leading-[1.7] max-w-3xl mb-8">
            {t("experienceDescription")}
          </p>
          <div className="grid sm:grid-cols-2 gap-10 max-w-3xl">
            <div>
              <p className="meta mb-3">{t("achievements")}</p>
              <ul className="space-y-1 text-[color:var(--color-ink)]">
                <li>&mdash; {t("achievement1")}</li>
                <li>&mdash; {t("achievement2")}</li>
                <li>&mdash; {t("achievement3")}</li>
              </ul>
            </div>
            <div>
              <p className="meta mb-3">{t("specialties")}</p>
              <ul className="space-y-1 text-[color:var(--color-ink)]">
                <li>&mdash; {t("specialty1")}</li>
                <li>&mdash; {t("specialty2")}</li>
                <li>&mdash; {t("specialty3")}</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <p className="meta mb-6">{t("coursesOffered")}</p>
          <ol className="divide-y divide-[color:var(--color-rule-soft)]">
            {courses.map((course, index) => {
              const ord = String(index + 1).padStart(2, "0");
              return (
                <li
                  key={index}
                  className="grid grid-cols-[3rem_1fr] sm:grid-cols-[5rem_1fr] gap-4 sm:gap-8 py-6"
                >
                  <p className="meta text-[color:var(--color-ink)]">{ord}</p>
                  <div>
                    <h4 className="text-xl sm:text-2xl text-[color:var(--color-ink)] mb-2 leading-tight">
                      {course.title}
                    </h4>
                    <p className="text-[color:var(--color-ink-soft)] leading-relaxed mb-3 max-w-prose">
                      {course.description}
                    </p>
                    <ul className="space-y-1 text-[color:var(--color-ink-soft)] max-w-prose">
                      {course.features.map((feature, idx) => (
                        <li key={idx} className="flex gap-3">
                          <span aria-hidden="true" className="text-[color:var(--color-teal-ink)]">&mdash;</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-24 border-t border-[color:var(--color-rule)] pt-10 max-w-3xl">
          <p className="meta mb-3">{t("philosophyTitle")}</p>
          <p className="headline-italic text-xl sm:text-2xl text-[color:var(--color-ink)] leading-[1.55]">
            &ldquo;{t("philosophyQuote")}&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
