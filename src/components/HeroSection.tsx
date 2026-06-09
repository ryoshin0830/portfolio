"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { m } from "framer-motion";
import Link from "next/link";
import NeuralBackground from "./NeuralBackground";
import SocialLinks from "./SocialLinks";
import type { FeedItem, FeedSource } from "@/types/articles";
import { BRAND_LABEL, SourceIcon } from "@/components/icons/BrandIcons";

// Monochrome brand mark as a source indicator (matches the editorial palette).
const SourceMark = ({ source }: { source: FeedSource }) => (
  <span className="inline-flex items-center text-[color:var(--color-ink-soft)]">
    <SourceIcon source={source} className="h-3.5 w-3.5" />
    <span className="sr-only">{BRAND_LABEL[source]}</span>
  </span>
);

const HeroSection = ({
  latestArticles,
  latestPosts,
}: {
  latestArticles: FeedItem[];
  latestPosts: FeedItem[];
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

  const hasActivity = latestArticles.length > 0 || latestPosts.length > 0;

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

  // One labelled column (Articles or Posts) of feed rows. A plain render
  // function (not a nested component) so it shares scope and isn't remounted.
  const renderColumn = (label: string, columnItems: FeedItem[]) => (
    <div>
      <p className="mb-3 border-b border-[color:var(--color-rule)] pb-2 text-xs font-medium uppercase tracking-wider text-[color:var(--color-ink-muted)]">
        {label}
      </p>
      <m.ul
        className="flex flex-col"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.06 } },
        }}
      >
        {columnItems.map((i) => (
          <m.li
            key={i.id}
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href={i.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-1 border-b border-[color:var(--color-rule-soft)] py-3 last:border-b-0"
            >
              <span className="flex items-start gap-2">
                <span className="flex shrink-0 translate-y-0.5 items-center gap-1">
                  {i.sources.map((s) => (
                    <SourceMark key={s} source={s} />
                  ))}
                </span>
                <span className="text-sm font-medium leading-snug text-[color:var(--color-ink)] transition-colors line-clamp-2 group-hover:text-[color:var(--color-accent)]">
                  {i.text}
                  <span className="sr-only"> — {tc("opensInNewTab")}</span>
                </span>
              </span>
              <span
                className="flex items-center gap-1.5 pl-[1.4rem] text-xs text-[color:var(--color-ink-muted)] num"
                suppressHydrationWarning
              >
                {formatDate(i.date)}
                <ArrowUpRight
                  size={11}
                  aria-hidden
                  className="transition-colors group-hover:text-[color:var(--color-accent)]"
                />
              </span>
            </Link>
          </m.li>
        ))}
      </m.ul>
    </div>
  );

  return (
    <section
      id="hero"
      className="relative min-h-svh flex flex-col items-center justify-center overflow-hidden bg-[color:var(--color-bg)] px-6 pt-24 pb-20"
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

        {/* Latest activity — articles and posts as two separate columns (mixing
            them by date buries the less-frequent articles). Server-rendered from
            props, so it's in the initial HTML; rows stagger in once on mount. */}
        <div className="mx-auto mt-14 w-full max-w-3xl min-h-[36rem] text-left md:min-h-[22rem]">
          {hasActivity && (
            <>
              <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2">
                {latestArticles.length > 0 &&
                  renderColumn(tWriting("latestArticles"), latestArticles)}
                {latestPosts.length > 0 && (
                  <div
                    className={
                      latestArticles.length > 0
                        ? "md:border-l md:border-[color:var(--color-rule)] md:pl-12"
                        : undefined
                    }
                  >
                    {renderColumn(tWriting("latestPosts"), latestPosts)}
                  </div>
                )}
              </div>

              {/* Secondary action — jumps to the full archive (#blog) at the
                  bottom of the page. The down arrow signals an in-page move,
                  distinct from each row's ↗ which opens the item off-site. */}
              <div className="mt-10 flex justify-center">
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
