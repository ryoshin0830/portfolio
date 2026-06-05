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
  const [rotate, setRotate] = useState(false);
  const [docVisible, setDocVisible] = useState(true);
  const t = useTranslations("hero");
  const tNames = useTranslations("names");

  const names = [
    tNames("japanese"),
    tNames("japaneseFurigana"),
    tNames("english"),
    tNames("chinese"),
  ];
  const roles = t.raw("roles") as string[];

  // Defer rotation until after the LCP measurement window so the primary
  // (server-rendered) name stays the stable LCP candidate and doesn't churn.
  useEffect(() => {
    const id = setTimeout(() => setRotate(true), 4000);
    return () => clearTimeout(id);
  }, []);

  // Pause the text rotation while the tab is hidden (no offscreen timer churn).
  useEffect(() => {
    const onVis = () => setDocVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (!rotate || !docVisible) return;
    const i = setInterval(
      () => setCurrentNameIndex((p) => (p + 1) % names.length),
      4000,
    );
    return () => clearInterval(i);
  }, [rotate, docVisible, names.length]);

  useEffect(() => {
    if (!rotate || !docVisible) return;
    const i = setInterval(
      () => setCurrentRoleIndex((p) => (p + 1) % roles.length),
      3500,
    );
    return () => clearInterval(i);
  }, [rotate, docVisible, roles.length]);

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
        {/* Rotating name — all variants stacked in one fixed-size grid cell so
            swapping which one is opaque causes ZERO reflow (no CLS). */}
        <div
          className="relative mb-8 grid place-items-center"
          style={{ minHeight: "var(--hero-name-h)" }}
        >
          {names.map((name, i) => (
            <h1
              key={i}
              className="display display--xxl whitespace-nowrap transition-opacity duration-500"
              style={{ gridArea: "1 / 1", opacity: i === currentNameIndex ? 1 : 0 }}
              aria-hidden={i === currentNameIndex ? undefined : true}
            >
              {name}
            </h1>
          ))}
        </div>

        {/* Rotating role under name — single <p>; only its text swaps. Box
            reserves 2 lines so a wrap on narrow screens can't shift the content
            below it. No aria-live: the rotation is ambient, and announcing a new
            title every 3.5s would be screen-reader noise (the first role is read
            with the page). */}
        <div
          className="relative mb-6 grid place-items-center"
          style={{ minHeight: "var(--hero-role-h)" }}
        >
          <p
            className="text-xl md:text-2xl font-medium text-[color:var(--color-accent)] text-center transition-opacity"
            style={{ gridArea: "1 / 1" }}
          >
            {roles[currentRoleIndex]}
          </p>
        </div>

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
            className="inline-flex items-center justify-center min-h-11 min-w-11 text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-accent)] transition-colors"
          >
            <FaEnvelope size={20} />
          </a>
          <a
            href="https://github.com/ryoshin0830"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="inline-flex items-center justify-center min-h-11 min-w-11 text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-accent)] transition-colors"
          >
            <FaGithub size={20} />
          </a>
          <a
            href="https://x.com/ryoshin0830"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            className="inline-flex items-center justify-center min-h-11 min-w-11 text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-accent)] transition-colors"
          >
            <SiX size={20} />
          </a>
          <a
            href="https://zenn.dev/ryoushin"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Zenn"
            className="inline-flex items-center justify-center min-h-11 min-w-11 text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-accent)] transition-colors"
          >
            <Image
              src="/logo-only.svg"
              alt=""
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
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 inline-flex items-center justify-center min-h-11 min-w-11 text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition-colors"
        aria-label="Scroll down"
      >
        <ChevronDown size={28} className="scroll-hint" />
      </button>
    </section>
  );
};

export default HeroSection;
