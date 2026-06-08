"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ArticleSource, MergedArticle } from "@/types/articles";

// Articles come from our own /api/articles route, which proxies and merges the
// full Zenn + Qiita history server-side (cross-posts deduplicated). The list is
// small, so we load it once and reveal it in batches as the user scrolls — no
// per-source infinite scroll to stack, so the section has a real end.
const BATCH = 8;

type Filter = "all" | ArticleSource;

// Typography-only badge — no brand colors, to stay within the monochrome
// editorial palette.
function SourceBadge({ source }: { source: ArticleSource }) {
  return (
    <span className="shrink-0 rounded-sm border border-[color:var(--color-rule)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[color:var(--color-ink-muted)]">
      {source === "zenn" ? "Zenn" : "Qiita"}
    </span>
  );
}

export default function WritingFeed() {
  const t = useTranslations("writingFeed");
  const locale = useLocale();
  const [articles, setArticles] = useState<MergedArticle[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/articles");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = (await res.json()) as { articles: MergedArticle[] };
        if (!cancelled) setArticles(data.articles);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "zenn") return articles.filter((a) => a.zennUrl);
    if (filter === "qiita") return articles.filter((a) => a.qiitaUrl);
    return articles;
  }, [articles, filter]);

  // Reset the reveal window whenever the filter changes so switching tabs
  // always starts from the top of that subset.
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
  // merged view prefer Zenn, falling back to Qiita.
  const linkFor = (a: MergedArticle) => {
    if (filter === "qiita") return a.qiitaUrl ?? a.zennUrl!;
    if (filter === "zenn") return a.zennUrl ?? a.qiitaUrl!;
    return a.zennUrl ?? a.qiitaUrl!;
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

        {/* Source filter — segmented text toggle, minimal chrome. */}
        {articles.length > 0 && (
          <div
            role="tablist"
            aria-label={t("title")}
            className="mb-2 flex items-center gap-5 text-sm"
          >
            {filters.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(f.key)}
                  className={`min-h-11 transition-colors ${
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
              <li key={a.zennUrl ?? a.qiitaUrl}>
                <Link
                  href={linkFor(a)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid grid-cols-1 md:grid-cols-[8rem_1fr_auto] items-baseline gap-2 md:gap-12 border-t border-[color:var(--color-rule-soft)] py-6 group last:border-b last:border-[color:var(--color-rule-soft)]"
                >
                  <span className="text-sm text-[color:var(--color-ink-muted)] num">
                    {formatDate(a.date)}
                  </span>
                  <span className="flex items-start gap-2.5">
                    {/* Show every platform the article lives on. */}
                    <span className="flex shrink-0 gap-1.5 translate-y-0.5">
                      {a.zennUrl && <SourceBadge source="zenn" />}
                      {a.qiitaUrl && <SourceBadge source="qiita" />}
                    </span>
                    <h3 className="text-lg md:text-xl font-semibold tracking-tight text-[color:var(--color-ink)] group-hover:text-[color:var(--color-accent)] transition-colors">
                      {a.title}
                    </h3>
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="text-[color:var(--color-ink-muted)] group-hover:text-[color:var(--color-accent)] transition-colors"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Infinite-scroll sentinel — reveals the next batch when it enters view. */}
        {hasMore && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}

        {/* Loading skeleton — reserves height so the section doesn't shift in. */}
        {loading && (
          <ul aria-hidden>
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="border-t border-[color:var(--color-rule-soft)] py-6 last:border-b"
              >
                <div className="h-5 w-2/3 rounded bg-[color:var(--color-bg-soft)]" />
              </li>
            ))}
          </ul>
        )}

        {/* Fetch failed — keep the section present with the profile links below. */}
        {error && !loading && articles.length === 0 && (
          <p className="text-base text-[color:var(--color-ink-soft)]">
            {t("subtitle")}
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
            <ArrowUpRight size={16} />
          </Link>
          <Link
            href="https://qiita.com/ryoshin0830"
            target="_blank"
            rel="noopener noreferrer"
            className="link-accent text-base"
          >
            {t("viewOnQiita")}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
