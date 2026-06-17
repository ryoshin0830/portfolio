"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  LuArrowUpRight as ArrowUpRight,
  LuSearch as Search,
  LuX as X,
} from "react-icons/lu";
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
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Defer the query so typing never blocks on re-filtering the list (React keeps
  // the input responsive and re-renders the results at a lower priority).
  const deferredQuery = useDeferredValue(query);
  // Split on whitespace → AND search (every term must match), so "next test"
  // narrows instead of widening. Case-insensitive; locale-folded for the latin
  // scripts (Japanese/Chinese are unaffected, comparison stays substring).
  const terms = useMemo(
    () =>
      deferredQuery
        .trim()
        .toLocaleLowerCase(locale)
        .split(/\s+/)
        .filter(Boolean),
    [deferredQuery, locale],
  );
  const isSearching = terms.length > 0;

  const filtered = useMemo(() => {
    const bySource =
      filter === "all" ? items : items.filter((i) => i.sources.includes(filter));
    if (terms.length === 0) return bySource;
    return bySource.filter((i) => {
      const haystack = i.text.toLocaleLowerCase(locale);
      return terms.every((term) => haystack.includes(term));
    });
  }, [items, filter, terms, locale]);

  // Reset the reveal window whenever the filter OR the search query changes so
  // each new result set always starts from the top.
  useEffect(() => {
    setVisibleCount(BATCH);
  }, [filter, deferredQuery]);

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

  // Wrap matched terms in <mark> so a hit is visible inside a long title. The
  // search is locale-folded substring, so match on the lower-cased text but
  // slice the original to preserve the displayed casing.
  const highlight = (text: string) => {
    if (terms.length === 0) return text;
    const lower = text.toLocaleLowerCase(locale);
    // Collect [start, end) spans for every term occurrence, then merge overlaps.
    const spans: [number, number][] = [];
    for (const term of terms) {
      let from = 0;
      let at = lower.indexOf(term, from);
      while (at !== -1) {
        spans.push([at, at + term.length]);
        from = at + term.length;
        at = lower.indexOf(term, from);
      }
    }
    if (spans.length === 0) return text;
    spans.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const [s, e] of spans) {
      const last = merged[merged.length - 1];
      if (last && s <= last[1]) last[1] = Math.max(last[1], e);
      else merged.push([s, e]);
    }
    const nodes: React.ReactNode[] = [];
    let cursor = 0;
    merged.forEach(([s, e], idx) => {
      if (s > cursor) nodes.push(text.slice(cursor, s));
      nodes.push(
        <mark
          key={idx}
          className="rounded-[3px] bg-[color:var(--color-accent)]/15 px-0.5 text-[color:var(--color-accent)]"
        >
          {text.slice(s, e)}
        </mark>,
      );
      cursor = e;
    });
    if (cursor < text.length) nodes.push(text.slice(cursor));
    return nodes;
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
    <section id="blog" className="section section--soft">
      <div className="section__inner">
        <header className="mb-12 md:mb-16">
          <p className="meta text-[color:var(--color-accent)] mb-3">{t("kicker")}</p>
          <h2 className="display display--xl mb-6">{t("title")}</h2>
          <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl">
            {t("subtitle")}
          </p>
        </header>

        {/* Search — filters the whole feed by text (article titles + post
            bodies), combined with the source filter below. Client-side only:
            the full feed is already in memory, so this is instant. */}
        {items.length > 0 && (
          <div className="relative mb-4 max-w-md">
            <Search
              size={18}
              aria-hidden
              className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[color:var(--color-ink-muted)]"
            />
            <input
              type="search"
              inputMode="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && query) {
                  e.preventDefault();
                  setQuery("");
                }
              }}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchLabel")}
              aria-controls="writing-feed-list"
              // Hide the native clear affordance; we render our own consistent one.
              className="w-full border-0 border-b border-[color:var(--color-rule)] bg-transparent py-2.5 pl-7 pr-8 text-base text-[color:var(--color-ink)] outline-none transition-colors placeholder:text-[color:var(--color-ink-muted)] focus:border-[color:var(--color-accent)] [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t("clearSearch")}
                className="absolute right-0 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[color:var(--color-ink-muted)] transition-colors hover:text-[color:var(--color-ink)]"
              >
                <X size={16} aria-hidden />
              </button>
            )}
          </div>
        )}

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

        {/* Result count — announced to screen readers as the query narrows the
            list; shown visually only while a search is active. */}
        <p
          role="status"
          aria-live="polite"
          className={`meta text-[color:var(--color-ink-muted)] ${
            isSearching ? "mb-2 mt-4" : "sr-only"
          }`}
        >
          {isSearching ? t("resultCount", { count: filtered.length }) : ""}
        </p>

        {filtered.length > 0 && (
          <ul id="writing-feed-list">
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
                      {highlight(i.text)}
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

        {/* Empty states — the section stays present with the profile links
            below as the fallback path. A no-match-for-query message is distinct
            from a genuinely empty feed, and offers a one-tap reset. */}
        {filtered.length === 0 &&
          (isSearching ? (
            <p className="prose-body text-[color:var(--color-ink-soft)]">
              {t("noResults", { query: deferredQuery.trim() })}{" "}
              <button
                type="button"
                onClick={() => setQuery("")}
                className="link-accent"
              >
                {t("clearSearch")}
              </button>
            </p>
          ) : (
            <p className="prose-body text-[color:var(--color-ink-soft)]">
              {t("empty")}
            </p>
          ))}

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
