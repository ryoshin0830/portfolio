"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface ZennArticle {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

export default function ZennFeed() {
  const t = useTranslations("zennFeed");
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
              .slice(0, 7)
              .map((i: { title: string; link: string; pubDate: string; description?: string }) => ({
                title: i.title,
                link: i.link,
                pubDate: i.pubDate,
                description: i.description || "",
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
    new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(s));

  if (loading || error || articles.length === 0) return null;

  const [featured, ...rest] = articles;

  return (
    <section id="blog" className="section section--rule">
      <div className="section__inner">
        <header className="border-b border-[color:var(--color-rule)] pb-6 mb-12">
          <div className="kicker mb-3">{t("title")}</div>
          <h2 className="display display--xl">{t("title")}</h2>
          <p className="mt-4 max-w-2xl text-base text-[color:var(--color-ink-soft)]">
            {t("subtitle")}
          </p>
        </header>

        {/* Featured */}
        <Link
          href={featured.link}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-edit grid grid-cols-1 md:grid-cols-[8rem_1fr_auto] gap-4 md:gap-12 border-y border-[color:var(--color-rule)] py-8 group items-baseline"
        >
          <div>
            <div className="kicker mb-1">{t("featured")}</div>
            <span className="font-mono num text-[13px] text-[color:var(--color-ink-soft)]">
              {formatDate(featured.pubDate)}
            </span>
          </div>
          <h3 className="font-semibold tracking-tight text-2xl md:text-3xl leading-tight text-[color:var(--color-ink)] group-hover:text-[color:var(--color-amber-mark)]">
            {featured.title}
          </h3>
          <ExternalLink
            size={18}
            className="text-[color:var(--color-ink-soft)] group-hover:text-[color:var(--color-amber-mark)] transition-colors"
          />
        </Link>

        {/* Rest as editorial list */}
        <ul className="mb-12">
          {rest.map((article, i) => (
            <li key={i}>
              <Link
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-edit grid grid-cols-1 md:grid-cols-[8rem_1fr_auto] items-baseline gap-3 md:gap-12 border-b border-[color:var(--color-rule-soft)] py-4 group"
              >
                <span className="font-mono text-[12px] text-[color:var(--color-ink-soft)] tracking-wider">
                  {formatDate(article.pubDate)}
                </span>
                <h4 className="font-semibold tracking-tight text-lg text-[color:var(--color-ink)] group-hover:text-[color:var(--color-amber-mark)]">
                  {article.title}
                </h4>
                <ExternalLink
                  size={14}
                  className="text-[color:var(--color-ink-soft)] group-hover:text-[color:var(--color-amber-mark)] transition-colors"
                />
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="https://zenn.dev/ryoushin"
          target="_blank"
          rel="noopener noreferrer"
          className="focus-edit inline-flex items-center gap-2 text-sm font-mono uppercase tracking-[0.16em] text-[color:var(--color-amber-mark)] hover:underline underline-offset-4"
        >
          <span>{t("viewAllArticles")}</span>
          <ExternalLink size={14} />
        </Link>
      </div>
    </section>
  );
}
