"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { FeedItem, FeedSource } from "@/types/articles";
import { BRAND_LABEL, SourceIcon } from "@/components/icons/BrandIcons";

// The unified activity feed: Zenn/Qiita articles and X posts merged and sorted
// by date server-side, passed in as a prop (no client fetch). The list is small,
// so we reveal it in batches as the user scrolls; it's one feed with a real end.
const BATCH = 8;

type Filter = "all" | FeedSource;

// Small monochrome brand mark used as a source indicator (replaces the old text
// badge — a logo reads faster). Decorative; the source name is sr-only.
function SourceMark({ source }: { source: FeedSource }) {
  return (
    <span className="inline-flex items-center text-[color:var(--color-ink-soft)]">
      <SourceIcon source={source} className="h-[1.05em] w-[1.05em]" />
      <span className="sr-only">{BRAND_LABEL[source]}</span>
    </span>
  );
}

export default function WritingFeed({ items }: { items: FeedItem[] }) {
  const t = useTranslations("writingFeed");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [filter, setFilter] = useState<Filter>("all");
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.sources.includes(filter));
  }, [items, filter]);

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

  // When a source filter is active, deep-link to that platform's copy; otherwise
  // use the item's primary URL. Every item has a URL by construction; "#" is a
  // defensive fallback only.
  const linkFor = (i: FeedItem) => {
    if (filter === "zenn") return i.zennUrl ?? i.url;
    if (filter === "qiita") return i.qiitaUrl ?? i.url;
    if (filter === "note") return i.noteUrl ?? i.url;
    return i.url;
  };

  const filters: { key: Filter; label: string; source?: FeedSource }[] = [
    { key: "all", label: t("filterAll") },
    { key: "zenn", label: "Zenn", source: "zenn" },
    { key: "qiita", label: "Qiita", source: "qiita" },
    { key: "note", label: "note", source: "note" },
    { key: "x", label: "X", source: "x" },
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
        {items.length > 0 && (
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
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 transition-colors ${
                    active
                      ? "text-[color:var(--color-accent)] font-semibold"
                      : "text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]"
                  }`}
                >
                  {f.source && (
                    <SourceIcon source={f.source} className="h-4 w-4" />
                  )}
                  {f.label}
                </button>
              );
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <ul>
            {filtered.slice(0, visibleCount).map((i) => (
              <li key={i.id}>
                <Link
                  href={linkFor(i)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-1.5 border-t border-[color:var(--color-rule-soft)] py-6 last:border-b last:border-[color:var(--color-rule-soft)] md:grid md:grid-cols-[8rem_1fr] md:items-baseline md:gap-12"
                >
                  <span
                    className="text-sm text-[color:var(--color-ink-muted)] num"
                    suppressHydrationWarning
                  >
                    {formatDate(i.date)}
                  </span>
                  {/* Logos + text + arrow share one cell so the arrow sits at
                      the end of the text instead of orphaning on its own row. */}
                  <span className="flex items-start gap-2.5">
                    <span className="flex shrink-0 items-center gap-1.5 text-lg translate-y-0.5 md:text-xl">
                      {i.sources.map((s) => (
                        <SourceMark key={s} source={s} />
                      ))}
                    </span>
                    <span
                      className={`flex-1 font-semibold tracking-tight text-[color:var(--color-ink)] group-hover:text-[color:var(--color-accent)] transition-colors ${
                        i.kind === "post"
                          ? "text-base leading-relaxed line-clamp-2 font-medium"
                          : "text-lg md:text-xl"
                      }`}
                    >
                      {i.text}
                      <span className="sr-only"> — {tc("opensInNewTab")}</span>
                    </span>
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
          <Link
            href="https://note.com/ryoshin0830"
            target="_blank"
            rel="noopener noreferrer"
            className="link-accent text-base"
          >
            {t("viewOnNote")}
            <ArrowUpRight size={16} aria-hidden />
            <span className="sr-only"> — {tc("opensInNewTab")}</span>
          </Link>
          <Link
            href="https://x.com/ryoshin0830"
            target="_blank"
            rel="noopener noreferrer"
            className="link-accent text-base"
          >
            {t("viewOnX")}
            <ArrowUpRight size={16} aria-hidden />
            <span className="sr-only"> — {tc("opensInNewTab")}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
