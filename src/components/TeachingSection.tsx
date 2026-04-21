"use client";

import { useTranslations } from "next-intl";
import { m } from "framer-motion";
import { useInView } from "react-intersection-observer";

export default function TeachingSection() {
  const t = useTranslations("teaching");
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

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

  return (
    <section
      id="teaching"
      ref={ref}
      className="section section--rule"
    >
      <div className="section__inner">
        <header className="border-b border-[color:var(--color-rule)] pb-6 mb-12">
          <div className="kicker mb-3">{t("title")}</div>
          <h2 className="display display--xl">{t("experienceTitle")}</h2>
          <p className="mt-4 max-w-2xl text-base text-[color:var(--color-ink-soft)]">
            {t("subtitle")}
          </p>
        </header>

        {/* JLPT N1 perfect score — editorial pull */}
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.4 }}
          className="mb-16 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 border-b border-[color:var(--color-rule-soft)] pb-12"
        >
          <div>
            <div className="kicker mb-2">JLPT N1</div>
            <div
              className="display num text-[color:var(--color-amber-mark)]"
              style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)", lineHeight: 0.95 }}
            >
              180
              <span className="font-semibold tracking-tight text-[color:var(--color-ink-soft)]" style={{ fontSize: "0.4em", marginLeft: "0.1em" }}>
                /180
              </span>
            </div>
            <p className="mt-2 font-semibold tracking-tight text-lg">{t("perfectScore")}</p>
          </div>
          <p className="text-sm text-[color:var(--color-ink-soft)] leading-relaxed self-end">
            {t("perfectScoreDescription")}
          </p>
        </m.div>

        {/* Stats — editorial mono row */}
        <m.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-0 border-y border-[color:var(--color-rule)] mb-16"
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className={`px-4 py-6 text-center ${
                i < stats.length - 1 ? "border-r border-[color:var(--color-rule-soft)]" : ""
              }`}
            >
              <div
                className="display num text-[color:var(--color-ink)]"
                style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", lineHeight: 1 }}
              >
                {s.value}
              </div>
              <div className="kicker mt-2">{s.label}</div>
            </div>
          ))}
        </m.div>

        {/* Experience description */}
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-16 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 border-b border-[color:var(--color-rule-soft)] pb-12"
        >
          <div>
            <div className="kicker mb-2">{t("experienceTitle")}</div>
            <h3 className="font-semibold tracking-tight text-2xl text-[color:var(--color-ink)]">
              {t("newOriental")}
            </h3>
          </div>
          <div>
            <p className="text-base leading-relaxed text-[color:var(--color-ink)] mb-6 max-w-[60ch]">
              {t("experienceDescription")}
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="kicker mb-2">{t("achievements")}</div>
                <ul className="space-y-1.5 text-sm">
                  {[t("achievement1"), t("achievement2"), t("achievement3")].map((a, i) => (
                    <li key={i} className="flex gap-2 text-[color:var(--color-ink)]">
                      <span className="text-[color:var(--color-amber-mark)]">·</span>
                      <span className="leading-relaxed">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="kicker mb-2">{t("specialties")}</div>
                <ul className="space-y-1.5 text-sm">
                  {[t("specialty1"), t("specialty2"), t("specialty3")].map((s, i) => (
                    <li key={i} className="flex gap-2 text-[color:var(--color-ink)]">
                      <span className="text-[color:var(--color-amber-mark)]">·</span>
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </m.div>

        {/* Courses */}
        <div className="mb-16">
          <div className="kicker mb-4">{t("coursesOffered")}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-[color:var(--color-rule)]">
            {courses.map((c, i) => (
              <m.article
                key={c.key}
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                className={`px-6 py-8 border-b border-[color:var(--color-rule-soft)] md:border-b-0 ${
                  i < courses.length - 1 ? "md:border-r" : ""
                }`}
              >
                <div className="kicker num mb-2">№ 0{i + 1}</div>
                <h4 className="font-semibold tracking-tight text-xl text-[color:var(--color-ink)] mb-2">
                  {c.title}
                </h4>
                <p className="text-sm text-[color:var(--color-ink-soft)] mb-4 leading-relaxed">
                  {c.description}
                </p>
                <ul className="space-y-1.5 text-sm">
                  {c.features.map((f, j) => (
                    <li key={j} className="flex gap-2 text-[color:var(--color-ink)]">
                      <span className="text-[color:var(--color-amber-mark)]">·</span>
                      <span className="leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
              </m.article>
            ))}
          </div>
        </div>

        {/* Philosophy quote */}
        <m.blockquote
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="border-l-4 border-[color:var(--color-amber-mark)] pl-8 max-w-[60ch] mt-12"
        >
          <div className="kicker mb-3">{t("philosophyTitle")}</div>
          <p className="font-semibold tracking-tight text-2xl leading-tight text-[color:var(--color-ink)]">
            &ldquo;{t("philosophyQuote")}&rdquo;
          </p>
        </m.blockquote>
      </div>
    </section>
  );
}
