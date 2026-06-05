"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { FaEnvelope, FaGithub } from "react-icons/fa";
import { SiX } from "react-icons/si";
import NeuralBackground from "./NeuralBackground";

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
      <NeuralBackground />

      <div className="relative z-10 text-center max-w-5xl mx-auto fade-up">
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

        {/* Credential — small inline meta */}
        <p className="text-sm text-[color:var(--color-ink-muted)] mb-12">
          {t("description")}
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

        {/* Contact links */}
        <div className="mt-10 flex items-center justify-center gap-6">
          <a
            href="mailto:ryo.shin.j85@kyoto-u.jp"
            aria-label="Email"
            className="text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-accent)] transition-colors"
          >
            <FaEnvelope size={20} />
          </a>
          <a
            href="https://github.com/ryoshin0830"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-accent)] transition-colors"
          >
            <FaGithub size={20} />
          </a>
          <a
            href="https://x.com/ryoshin0830"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            className="text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-accent)] transition-colors"
          >
            <SiX size={20} />
          </a>
          <a
            href="https://zenn.dev/ryoushin"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Zenn"
            className="text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-accent)] transition-colors"
          >
            <Image
              src="/logo-only.svg"
              alt="Zenn"
              width={20}
              height={20}
              unoptimized
              className="w-5 h-5"
            />
          </a>
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToWork}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition-colors"
        aria-label="Scroll down"
      >
        <ChevronDown size={28} className="scroll-hint" />
      </button>
    </section>
  );
};

export default HeroSection;
