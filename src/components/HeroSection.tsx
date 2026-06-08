"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { m } from "framer-motion";
import Link from "next/link";
import NeuralBackground from "./NeuralBackground";
import SocialLinks from "./SocialLinks";
import type { ArticleSource, MergedArticle } from "@/types/articles";

// Typography-only source badge, matching the editorial monochrome palette.
const SourceBadge = ({ source }: { source: ArticleSource }) => (
  <span className="rounded-sm border border-[color:var(--color-rule)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[color:var(--color-ink-soft)]">
    {source === "zenn" ? "Zenn" : "Qiita"}
  </span>
);

const HeroSection = ({
  latestArticles,
}: {
  latestArticles: MergedArticle[];
}) => {
  const [currentNameIndex, setCurrentNameIndex] = useState(0);
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [rotate, setRotate] = useState(false);
  const [docVisible, setDocVisible] = useState(true);
  const t = useTranslations("hero");
  const tNames = useTranslations("names");
  const tWriting = useTranslations("heroWriting");
  const tc = useTranslations("common");
  const locale = useLocale();

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

  // Latest articles (top 3, merged Zenn + Qiita) come in as a prop from the
  // server — rendered below the fold of the centered hero, so they never affect
  // the LCP name candidate.
  const articles = latestArticles;

  // Honor prefers-reduced-motion for programmatic scrolls (CSS scroll-behavior
  // is already reset for it, but scrollIntoView's JS option is not).
  const scrollTo = (id: string) => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };
  const scrollToHighlights = () => scrollTo("highlights");
  const scrollToBlog = () => scrollTo("blog");

  const formatDate = (s: string) =>
    new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(s));

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
          onClick={scrollToHighlights}
          className="btn-pill btn-pill--ghost"
          aria-label={t("viewWork")}
        >
          {t("viewWork")}
          <span aria-hidden>→</span>
        </button>

        {/* All contact methods (locale-ordered, with QR dialogs) */}
        <div className="mt-10">
          <SocialLinks />
        </div>

        {/* Latest articles (Zenn + Qiita) — server-rendered from props, so the
            list is in the initial HTML (no client fetch). The min-height keeps
            a stable floor; rows stagger in once on mount (one-time entrance). */}
        <div
          className="mx-auto mt-12 max-w-3xl min-h-[25rem] md:min-h-[13rem]"
        >
          {articles.length > 0 && (
            <>
              <p className="text-xs uppercase tracking-wider text-[color:var(--color-ink-muted)] font-medium mb-3 text-center">
                {tWriting("latestPost")}
              </p>
              <m.ul
                className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3 md:gap-y-0"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.08 } },
                }}
              >
                {articles.map((a) => (
                  <m.li
                    key={a.zennUrl ?? a.qiitaUrl ?? a.title}
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={a.zennUrl ?? a.qiitaUrl ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-full flex-col border-t border-[color:var(--color-rule-soft)] pt-4 group text-left"
                    >
                      <span className="mb-2 flex gap-1.5">
                        {a.zennUrl && <SourceBadge source="zenn" />}
                        {a.qiitaUrl && <SourceBadge source="qiita" />}
                      </span>
                      <span className="text-sm font-medium leading-snug text-[color:var(--color-ink)] group-hover:text-[color:var(--color-accent)] transition-colors line-clamp-2 min-h-[2.5rem]">
                        {a.title}
                        <span className="sr-only"> — {tc("opensInNewTab")}</span>
                      </span>
                      <span
                        className="mt-2 flex items-center gap-1.5 text-xs text-[color:var(--color-ink-muted)] num"
                        suppressHydrationWarning
                      >
                        {formatDate(a.date)}
                        <ArrowUpRight
                          size={12}
                          aria-hidden
                          className="group-hover:text-[color:var(--color-accent)] transition-colors"
                        />
                      </span>
                    </Link>
                  </m.li>
                ))}
              </m.ul>

              {/* Secondary action — jumps to the full archive (#blog) at the
                  bottom of the page. The down arrow signals an in-page move,
                  distinct from each card's ↗ which opens the article off-site. */}
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={scrollToBlog}
                  className="link-accent text-base min-h-11"
                >
                  {tWriting("viewAll")}
                  <ArrowDown size={16} aria-hidden />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
