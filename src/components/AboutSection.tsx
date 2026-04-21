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
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true });

  const expertise = t.raw("expertise") as Expertise[];
  const credentials = t.raw("credentials") as {
    education: string;
    founded: string;
    github: string;
  };

  return (
    <section id="about" ref={ref} className="section">
      <div className="section__inner">
        <h2 className="display display--xl mb-16">{t("title")}</h2>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <p className="prose-body text-[color:var(--color-ink)] mb-10">
            {t("pr")}
          </p>
          <p className="text-base text-[color:var(--color-ink-soft)] leading-relaxed">
            {credentials.education}　·　{credentials.founded}　·
            <a
              href="https://github.com/ryoshin0830"
              target="_blank"
              rel="noopener noreferrer"
              className="link-accent"
            >
              {credentials.github}
            </a>
          </p>
        </m.div>

        {/* Expertise — 3 large cards, Apple-style spacing */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          {expertise.map((e, i) => (
            <m.article
              key={e.id}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
            >
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                {e.title}
              </h3>
              <p className="text-base text-[color:var(--color-ink-soft)] leading-relaxed">
                {e.description}
              </p>
            </m.article>
          ))}
        </div>

        {/* Timeline — kept but visually quieter */}
        <div className="mt-32">
          <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-12">
            {t("timeline")}
          </h3>
          <TimelineSection />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
