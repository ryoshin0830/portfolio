"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface ZennArticle {
  title: string;
  link: string;
  pubDate: string;
}

export default function ZennFeed() {
  const t = useTranslations("zennFeed");
  const locale = useLocale();
  const [articles, setArticles] = useState<ZennArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const RSS_URL = "https://zenn.dev/ryoushin/feed";
        const res = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`,
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (data.items && !cancelled) {
          setArticles(
            data.items
              .slice(0, 6)
              .map((i: { title: string; link: string; pubDate: string }) => ({
                title: i.title,
                link: i.link,
                pubDate: i.pubDate,
              })),
          );
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (s: string) =>
    new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(s));

  // Always render the section so the #blog nav anchor never points at nothing.
  // The article list shows only when the RSS fetch succeeds; otherwise the
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

        {/* Fetch failed — keep the section present with the Zenn link above. */}
        {error && !loading && (
          <p className="text-base text-[color:var(--color-ink-soft)]">
            {t("subtitle")}
          </p>
        )}
      </div>
    </section>
  );
}
