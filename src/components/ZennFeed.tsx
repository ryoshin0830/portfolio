"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface ZennArticle {
  title: string;
  link: string;
  pubDate: string;
}

// Articles come from our own /api/zenn route, which proxies Zenn's public
// articles API server-side (the API has no CORS headers, so the browser can't
// call it directly) and paginates the *full* post history. We page through it
// on demand so the infinite scroll can reach every article.
export default function ZennFeed() {
  const t = useTranslations("zennFeed");
  const locale = useLocale();
  const [articles, setArticles] = useState<ZennArticle[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Guard against overlapping fetches — the sentinel can fire repeatedly while
  // a request is still in flight.
  const fetchingRef = useRef(false);

  const loadPage = useCallback(async (page: number) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/zenn?page=${page}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = (await res.json()) as {
        articles: ZennArticle[];
        nextPage: number | null;
      };
      setArticles((prev) => [...prev, ...data.articles]);
      setNextPage(data.nextPage ?? null);
    } catch (e) {
      console.error(e);
      setError(true);
      setNextPage(null);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  // Initial load.
  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  // Infinite scroll: fetch the next page whenever the sentinel enters view,
  // until Zenn reports no further pages (next_page === null).
  useEffect(() => {
    if (nextPage === null) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !fetchingRef.current) {
          loadPage(nextPage);
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [nextPage, loadPage]);

  const formatDate = (s: string) =>
    new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(s));

  // Always render the section so the #blog nav anchor never points at nothing.
  // The article list shows only when the API fetch succeeds; otherwise the
  // header's "view all on Zenn" link is the graceful fallback.
  return (
    <section id="blog" className="section">
      <div className="section__inner">
        <header className="mb-20 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h2 className="display display--xl mb-6">{t("title")}</h2>
            <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl">
              {t("subtitle")}
            </p>
          </div>
          <Link
            href="https://zenn.dev/ryoushin"
            target="_blank"
            rel="noopener noreferrer"
            className="link-accent text-base"
          >
            {t("viewAllArticles")}
            <ArrowUpRight size={16} />
          </Link>
        </header>

        {articles.length > 0 && (
          <ul>
            {articles.map((a) => (
              <li key={a.link}>
                <Link
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid grid-cols-1 md:grid-cols-[8rem_1fr_auto] items-baseline gap-3 md:gap-12 border-t border-[color:var(--color-rule-soft)] py-6 group last:border-b last:border-[color:var(--color-rule-soft)]"
                >
                  <span className="text-sm text-[color:var(--color-ink-muted)] num">
                    {formatDate(a.pubDate)}
                  </span>
                  <h3 className="text-lg md:text-xl font-semibold tracking-tight text-[color:var(--color-ink)] group-hover:text-[color:var(--color-accent)] transition-colors">
                    {a.title}
                  </h3>
                  <ArrowUpRight
                    size={16}
                    className="text-[color:var(--color-ink-muted)] group-hover:text-[color:var(--color-accent)] transition-colors"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Infinite-scroll sentinel — fetches the next page when it enters view. */}
        {nextPage !== null && (
          <div ref={sentinelRef} aria-hidden className="h-px w-full" />
        )}

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

        {/* Fetch failed before any article loaded — keep the section present
            with the Zenn link above as the fallback. */}
        {error && !loading && articles.length === 0 && (
          <p className="text-base text-[color:var(--color-ink-soft)]">
            {t("subtitle")}
          </p>
        )}
      </div>
    </section>
  );
}
