"use client";

import { useTranslations } from "next-intl";
import { m } from "framer-motion";
import { useInView } from "react-intersection-observer";

export default function TeachingSection() {
  const t = useTranslations("teaching");
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true });

  const stats = [
    { value: "7", label: t("yearsExperience") },
    { value: "5,000+", label: t("teachingHours") },
    { value: "300+", label: t("studentsTotal") },
    { value: "95%", label: t("passRate") },
  ];

  const courses = [
    {
      key: "basic",
      title: t("courses.basic.title"),
      description: t("courses.basic.description"),
      features: t.raw("courses.basic.features") as string[],
    },
    {
      key: "jlpt",
      title: t("courses.jlpt.title"),
      description: t("courses.jlpt.description"),
      features: t.raw("courses.jlpt.features") as string[],
    },
    {
      key: "business",
      title: t("courses.business.title"),
      description: t("courses.business.description"),
      features: t.raw("courses.business.features") as string[],
    },
  ];

  const achievements = [t("achievement1"), t("achievement2"), t("achievement3")];
  const specialties = [t("specialty1"), t("specialty2"), t("specialty3")];

  return (
    <section id="teaching" ref={ref} className="section">
      <div className="section__inner">
        <header className="mb-16">
          <h2 className="display display--xl mb-6">{t("title")}</h2>
          <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl">
            {t("subtitle")}
          </p>
        </header>

        {/* Big number — JLPT 180/180 Apple style */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-32"
        >
          <p
            className="display num mb-4"
            style={{
              fontSize: "clamp(4rem, 13vw, 10rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.05em",
              color: "var(--color-accent)",
            }}
          >
            180
            <span
              className="text-[color:var(--color-ink-soft)]"
              style={{ fontSize: "0.4em", fontWeight: 500 }}
            >
              /180
            </span>
          </p>
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
            JLPT N1 {t("perfectScore")}
          </h3>
          <p className="prose-body text-[color:var(--color-ink-soft)] max-w-xl mx-auto">
            {t("perfectScoreDescription")}
          </p>
        </m.div>

        {/* Stats — 4 column generous grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-32">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p
                className="num text-[color:var(--color-ink)] mb-2"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  fontWeight: 600,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                }}
              >
                {s.value}
              </p>
              <p className="text-sm text-[color:var(--color-ink-soft)]">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Experience description + Achievements + Specialties */}
        <div className="mb-32 max-w-4xl">
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
            {t("newOriental")}
          </h3>
          <p className="prose-body text-[color:var(--color-ink-soft)] mb-12">
            {t("experienceDescription")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-sm font-medium text-[color:var(--color-ink-muted)] mb-4">
                {t("achievements")}
              </p>
              <ul className="space-y-3 text-base text-[color:var(--color-ink)]">
                {achievements.map((a, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-[color:var(--color-accent)] shrink-0">·</span>
                    <span className="leading-relaxed">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium text-[color:var(--color-ink-muted)] mb-4">
                {t("specialties")}
              </p>
              <ul className="space-y-3 text-base text-[color:var(--color-ink)]">
                {specialties.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-[color:var(--color-accent)] shrink-0">·</span>
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Courses */}
        <div>
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-12">
            {t("coursesOffered")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            {courses.map((c) => (
              <article key={c.key}>
                <h4 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">
                  {c.title}
                </h4>
                <p className="text-base text-[color:var(--color-ink-soft)] mb-5 leading-relaxed">
                  {c.description}
                </p>
                <ul className="space-y-2 text-base text-[color:var(--color-ink)]">
                  {c.features.map((f, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="text-[color:var(--color-accent)] shrink-0">·</span>
                      <span className="leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        {/* Philosophy */}
        <m.blockquote
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-32 max-w-3xl mx-auto text-center"
        >
          <p className="text-2xl md:text-3xl font-semibold tracking-tight leading-snug">
            &ldquo;{t("philosophyQuote")}&rdquo;
          </p>
          <footer className="mt-6 text-sm font-medium text-[color:var(--color-ink-muted)]">
            {t("philosophyTitle")}
          </footer>
        </m.blockquote>
      </div>
    </section>
  );
}
