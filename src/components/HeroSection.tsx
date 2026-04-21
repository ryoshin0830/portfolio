"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

const HeroSection = () => {
  const [currentNameIndex, setCurrentNameIndex] = useState(0);
  const t = useTranslations("hero");
  const tNames = useTranslations("names");

  const names = [
    tNames("japanese"),
    tNames("japaneseFurigana"),
    tNames("english"),
    tNames("chinese"),
  ];

  useEffect(() => {
    const i = setInterval(
      () => setCurrentNameIndex((p) => (p + 1) % names.length),
      4000,
    );
    return () => clearInterval(i);
  }, [names.length]);

  const scrollToWork = () => {
    document.getElementById("experience")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[color:var(--color-bg)] px-6"
    >
      <div className="text-center max-w-5xl mx-auto fade-up">
        <h1 className="display display--xxl mb-8">{names[currentNameIndex]}</h1>
        <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl mx-auto mb-12 text-balance">
          {t("subtitle")}
        </p>
        <button
          type="button"
          onClick={scrollToWork}
          className="btn-pill"
          aria-label="View work"
        >
          View work
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
