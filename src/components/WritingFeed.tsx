"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ArticleSource, MergedArticle } from "@/types/articles";

// Articles are fetched and merged server-side (cross-posts deduplicated) and
// passed in as a prop — no client fetch. The list is small, so we reveal it in
// batches as the user scrolls; it's one feed, so the section has a real end.
const BATCH = 8;

type Filter = "all" | ArticleSource;

// Typography-only badge — no brand colors, to stay within the monochrome
// editorial palette. Colorblind-safe (text, not color).
function SourceBadge({ source }: { source: ArticleSource }) {
  return (
    <span className="shrink-0 rounded-sm border border-[color:var(--color-rule)] px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-ink-soft)]">
      {source === "zenn" ? "Zenn" : "Qiita"}
    </span>
  );
}

export default function WritingFeed({ articles }: { articles: MergedArticle[] }) {
  const t = useTranslations("writingFeed");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [filter, setFilter] = useState<Filter>("all");
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    if (filter === "zenn") return articles.filter((a) => a.zennUrl);
    if (filter === "qiita") return articles.filter((a) => a.qiitaUrl);
    return articles;
  }, [articles, filter]);

  // Reset the reveal window whenever the filter changes so switching always
  // starts from the top of that subset.
  useEffect(() => {
    setVisibleCount(BATCH);
  }, [filter]);

  const hasMore = visibleCount < filtered.length;
  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + BATCH, filtered.length));
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, filtered.length]);

  const formatDate = (s: string) =>
    new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(s));

  // When a filter is active, link straight to that platform's copy; in the
  // merged view prefer Zenn, falling back to Qiita. Every merged entry has at
  // least one URL by construction; "#" is a defensive fallback only.
  const linkFor = (a: MergedArticle) => {
    if (filter === "qiita") return a.qiitaUrl ?? a.zennUrl ?? "#";
    if (filter === "zenn") return a.zennUrl ?? a.qiitaUrl ?? "#";
    return a.zennUrl ?? a.qiitaUrl ?? "#";
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "zenn", label: "Zenn" },
    { key: "qiita", label: "Qiita" },
  ];

  // Always render the section so the #blog nav anchor never points at nothing.
  return (
    <section id="blog" className="section">
      <div className="section__inner">
        <header className="mb-12 md:mb-16">
          <h2 className="display display--xl mb-6">{t("title")}</h2>
          <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl">
            {t("subtitle")}
          </p>
        </header>

        {/* Source filter — toggle buttons (not ARIA tabs: this filters one list
            in place, so aria-pressed is the correct contract). */}
        {articles.length > 0 && (
          <div
            role="group"
            aria-label={t("title")}
            className="mb-2 flex flex-wrap items-center gap-2 text-sm"
          >
            {filters.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f.key)}
                  className={`inline-flex min-h-11 items-center rounded-full px-3.5 transition-colors ${
                    active
                      ? "text-[color:var(--color-accent)] font-semibold"
                      : "text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <ul>
            {filtered.slice(0, visibleCount).map((a) => (
              <li key={a.zennUrl ?? a.qiitaUrl ?? a.title}>
                <Link
                  href={linkFor(a)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-1.5 border-t border-[color:var(--color-rule-soft)] py-6 last:border-b last:border-[color:var(--color-rule-soft)] md:grid md:grid-cols-[8rem_1fr] md:items-baseline md:gap-12"
                >
                  <span
                    className="text-sm text-[color:var(--color-ink-muted)] num"
                    suppressHydrationWarning
                  >
                    {formatDate(a.date)}
                  </span>
                  {/* Badges + title + arrow share one cell so the arrow sits at
                      the end of the title instead of orphaning on its own row. */}
                  <span className="flex items-start gap-2.5">
                    <span className="flex shrink-0 gap-1.5 translate-y-1">
                      {a.zennUrl && <SourceBadge source="zenn" />}
                      {a.qiitaUrl && <SourceBadge source="qiita" />}
                    </span>
                    <h3 className="flex-1 text-lg md:text-xl font-semibold tracking-tight text-[color:var(--color-ink)] group-hover:text-[color:var(--color-accent)] transition-colors">
                      {a.title}
                      <span className="sr-only"> — {tc("opensInNewTab")}</span>
                    </h3>
                    <ArrowUpRight
                      size={16}
                      aria-hidden
                      className="mt-1 shrink-0 self-start text-[color:var(--color-ink-muted)] group-hover:text-[color:var(--color-accent)] transition-colors md:mt-0"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Infinite-scroll sentinel — reveals the next batch when it enters view. */}
        {hasMore && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}

        {/* Empty / failed — the section stays present with the profile links
            below as the fallback path. */}
        {filtered.length === 0 && (
          <p className="prose-body text-[color:var(--color-ink-soft)]">
            {t("empty")}
          </p>
        )}

        {/* Profile links — always available, even if the feed is empty. */}
        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3">
          <Link
            href="https://zenn.dev/ryoushin"
            target="_blank"
            rel="noopener noreferrer"
            className="link-accent text-base"
          >
            {t("viewOnZenn")}
            <ArrowUpRight size={16} aria-hidden />
            <span className="sr-only"> — {tc("opensInNewTab")}</span>
          </Link>
          <Link
            href="https://qiita.com/ryoshin0830"
            target="_blank"
            rel="noopener noreferrer"
            className="link-accent text-base"
          >
            {t("viewOnQiita")}
            <ArrowUpRight size={16} aria-hidden />
            <span className="sr-only"> — {tc("opensInNewTab")}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
