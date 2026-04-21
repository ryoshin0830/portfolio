"use client";

import { useTranslations } from "next-intl";
import { m } from "framer-motion";
import { useInView } from "react-intersection-observer";
import dynamic from "next/dynamic";
import type { Expertise } from "@/types/content";

const TimelineSection = dynamic(() => import("./TimelineSection"), {
  ssr: false,
});

const AboutSection = () => {
  const t = useTranslations("about");
  const badgesT = useTranslations("badges");
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  const fields = t.raw("fields") as string[];
  const expertise = t.raw("expertise") as Expertise[];
  const capabilities = t.raw("capabilities") as string[];
  const credentials = t.raw("credentials") as { education: string; founded: string; github: string };

  return (
    <section
      id="about"
      ref={ref}
      className="section section--rule bg-[color:var(--color-paper)]"
    >
      <div className="section__inner">
        {/* Editorial section header */}
        <header className="border-b border-[color:var(--color-rule)] pb-6 mb-12">
          <div className="kicker mb-3">{badgesT("aboutMe")}</div>
          <h2 className="display display--xl">{t("title")}</h2>
          <p className="mt-4 max-w-2xl text-base text-[color:var(--color-ink-soft)]">
            {t("subtitle")}
          </p>
        </header>

        {/* Lede paragraph with dropcap */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-12 mb-20"
        >
          <p className="text-lg leading-[1.75] text-[color:var(--color-ink)] max-w-[68ch]">
            {t("pr")}
          </p>
          <aside className="border-l border-[color:var(--color-rule-soft)] pl-6 text-sm space-y-3 self-start">
            <div>
              <div className="kicker mb-1">Education</div>
              <div>{credentials.education}</div>
            </div>
            <div>
              <div className="kicker mb-1">Company</div>
              <div>{credentials.founded}</div>
            </div>
            <div>
              <div className="kicker mb-1">GitHub</div>
              <a
                href="https://github.com/ryoshin0830"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[0.875rem] text-[color:var(--color-teal-ink)] underline-offset-4 hover:underline focus-edit"
              >
                {credentials.github}
              </a>
            </div>
          </aside>
        </m.div>

        {/* Expertise — 3 editorial cards */}
        <div className="mb-20">
          <div className="kicker mb-4">{t("expertiseLabel")}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-[color:var(--color-rule)]">
            {expertise.map((e, i) => (
              <m.article
                key={e.id}
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="border-b border-[color:var(--color-rule-soft)] md:border-b-0 md:border-r last:border-r-0 px-6 py-8"
              >
                <div className="kicker num mb-3">№ 0{i + 1}</div>
                <h3 className="font-semibold tracking-tight text-2xl leading-tight mb-3 text-[color:var(--color-ink)]">
                  {e.title}
                </h3>
                <p className="text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
                  {e.description}
                </p>
              </m.article>
            ))}
          </div>
        </div>

        {/* Capabilities — single horizontal row */}
        <div className="mb-20">
          <div className="kicker mb-3">{t("capabilitiesLabel")}</div>
          <div className="flex flex-wrap gap-2">
            {capabilities.map((c) => (
              <span key={c} className="tag-mono">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Specialisation fields — list */}
        <div className="mb-20">
          <div className="kicker mb-3">{t("specialization")}</div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 text-base">
            {fields.map((f, i) => (
              <li key={i} className="flex gap-3 border-t border-[color:var(--color-rule-soft)] pt-3">
                <span className="kicker num shrink-0 pt-1">№ 0{i + 1}</span>
                <span className="text-[color:var(--color-ink)]">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Timeline */}
        <div>
          <div className="kicker mb-4">{t("timeline")}</div>
          <TimelineSection />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
