"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

const HeroSection = () => {
  const [currentNameIndex, setCurrentNameIndex] = useState(0);
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const t = useTranslations("hero");
  const tNames = useTranslations("names");

  const names = [
    tNames("japanese"),
    tNames("japaneseFurigana"),
    tNames("english"),
    tNames("chinese"),
  ];
  const roles = t.raw("roles") as string[];

  useEffect(() => {
    const i = setInterval(
      () => setCurrentNameIndex((p) => (p + 1) % names.length),
      4000,
    );
    return () => clearInterval(i);
  }, [names.length]);

  useEffect(() => {
    const i = setInterval(
      () => setCurrentRoleIndex((p) => (p + 1) % roles.length),
      3500,
    );
    return () => clearInterval(i);
  }, [roles.length]);

  const scrollToWork = () => {
    document.getElementById("experience")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[color:var(--color-bg)] px-6 pt-24 pb-20"
    >
      <div className="text-center max-w-5xl mx-auto fade-up">
        {/* Tiny eyebrow above name — currently at */}
        <p className="text-sm md:text-base text-[color:var(--color-ink-muted)] mb-6 font-medium">
          {t("currentlyAt")}
        </p>

        <h1 className="display display--xxl mb-8">{names[currentNameIndex]}</h1>

        {/* Rotating role under name */}
        <p
          className="text-xl md:text-2xl font-medium text-[color:var(--color-accent)] mb-6 transition-opacity"
          aria-live="polite"
        >
          {roles[currentRoleIndex]}
        </p>

        <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl mx-auto mb-10 text-balance">
          {t("subtitle")}
        </p>

        {/* Origin / current — small inline meta */}
        <p className="text-sm text-[color:var(--color-ink-muted)] mb-3">
          <span className="font-medium text-[color:var(--color-ink-soft)]">{t("origin")}</span> {t("beijing")}
          <span className="mx-3 text-[color:var(--color-rule)]">·</span>
          <span className="font-medium text-[color:var(--color-ink-soft)]">{t("current")}</span> {t("kyoto")}
          <span className="mx-3 text-[color:var(--color-rule)]">·</span>
          {t("description")}
        </p>
        <p className="text-xs text-[color:var(--color-ink-muted)] font-mono num mb-12 tracking-wider">
          {t("coordinate")}
        </p>

        <button
          type="button"
          onClick={scrollToWork}
          className="btn-pill"
          aria-label={t("viewWork")}
        >
          {t("viewWork")}
          <span aria-hidden>→</span>
        </button>
      </div>

      <button
        type="button"
        onClick={scrollToWork}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition-colors"
        aria-label="Scroll down"
      >
        <ChevronDown size={28} className="scroll-hint" />
      </button>
    </section>
  );
};

export default HeroSection;
