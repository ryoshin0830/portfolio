"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import dynamic from "next/dynamic";
import { FaGithub } from "react-icons/fa";
import type { Expertise } from "@/types/content";
import { ExpertiseIcon } from "@/components/icons/ExpertiseIcons";

const TimelineSection = dynamic(() => import("./TimelineSection"), {
  ssr: false,
});

const AboutSection = () => {
  const t = useTranslations("about");
  const sectionRef = useRef<HTMLElement>(null);

  const fields = t.raw("fields") as string[];
  const expertise = t.raw("expertise") as Expertise[];
  const capabilities = t.raw("capabilities") as string[];
  const credentials = t.raw("credentials") as {
    education: string;
    github: string;
  };

  // 画面に入った要素を一度だけ持ち上げる。scrub ではないので
  // スクロール中に回り続けることはない。
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-reveal]", {
          opacity: 0,
          y: 16,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 85%" },
        });
      });
      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section id="about" ref={sectionRef} className="section section--pt-tight section--pb-tight">
      <div className="section__inner">
        <header className="mb-16">
          <p className="meta text-[color:var(--color-accent)] mb-3">{t("kicker")}</p>
          <h2 data-reveal-head className="display display--xl mb-6">{t("title")}</h2>
          <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl">
            {t("subtitle")}
          </p>
        </header>

        <div data-reveal className="max-w-3xl mb-16">
          <p className="prose-body text-[color:var(--color-ink)] mb-10">
            {t("pr")}
          </p>
          <p className="text-base text-[color:var(--color-ink-soft)] leading-relaxed mb-6">
            {credentials.education}
          </p>
          <a
            href="https://github.com/ryoshin0830"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`GitHub: ${credentials.github}`}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-rule)] px-4 py-2 text-sm font-medium text-[color:var(--color-ink)] transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
          >
            <FaGithub className="w-4 h-4 shrink-0" aria-hidden />
            <span className="num">{credentials.github}</span>
          </a>
        </div>

        {/* Capabilities — strengths chips */}
        <div className="mb-24">
          <p className="text-base font-medium text-[color:var(--color-ink-muted)] mb-4">
            {t("capabilitiesLabel")}
          </p>
          <div data-stagger className="flex flex-wrap gap-2">
            {capabilities.map((c) => (
              <span key={c} className="chip">{c}</span>
            ))}
          </div>
        </div>

        {/* Expertise — 3 large cards */}
        <div className="mb-24">
          <p className="text-base font-medium text-[color:var(--color-ink-muted)] mb-8">
            {t("expertiseLabel")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            {expertise.map((e) => (
              <article key={e.id} data-reveal>
                <ExpertiseIcon
                  id={e.id}
                  className="mb-5 h-8 w-8 text-[color:var(--color-accent)]"
                />
                <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                  {e.title}
                </h3>
                <p className="text-base text-[color:var(--color-ink-soft)] leading-relaxed">
                  {e.description}
                </p>
              </article>
            ))}
          </div>
        </div>

        {/* Specialization fields — academic focus areas */}
        <div className="mb-24 max-w-3xl">
          <p className="text-base font-medium text-[color:var(--color-ink-muted)] mb-6">
            {t("specialization")}
          </p>
          <ul className="space-y-3">
            {fields.map((f, i) => (
              <li
                key={i}
                className="flex gap-3 text-base text-[color:var(--color-ink)]"
              >
                <span className="text-[color:var(--color-accent)] shrink-0">·</span>
                <span className="leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Timeline */}
        <div className="mt-20">
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
