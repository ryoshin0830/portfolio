"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface ZennArticle {
  title: string;
  link: string;
  pubDate: string;
}

type Rss2JsonItem = {
  title?: string;
  link?: string;
  pubDate?: string;
};

type Rss2JsonResponse = {
  items?: Rss2JsonItem[];
};

export default function LatestZennArticle() {
  const t = useTranslations("heroZenn");
  const locale = useLocale();
  const [articles, setArticles] = useState<ZennArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const RSS_URL = "https://zenn.dev/ryoushin/feed";
        const response = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`,
        );
        if (!response.ok) throw new Error("Failed to fetch");
        const data = (await response.json()) as Rss2JsonResponse;
        if (Array.isArray(data.items) && data.items.length > 0 && !cancelled) {
          const items = data.items
            .filter(
              (i): i is Required<Pick<Rss2JsonItem, "title" | "link" | "pubDate">> =>
                typeof i.title === "string" &&
                typeof i.link === "string" &&
                typeof i.pubDate === "string",
            )
            .slice(0, 3)
            .map((i) => ({ title: i.title, link: i.link, pubDate: i.pubDate }));
          setArticles(items);
        }
      } catch (err) {
        console.error("Error fetching latest Zenn articles:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / 86400000);
    if (diffDays <= 1) return t("today");
    if (diffDays <= 7) return t("daysAgo", { days: diffDays });
    return new Intl.DateTimeFormat(
      locale === "ja" ? "ja-JP" : locale === "zh" ? "zh-CN" : "en-US",
      { month: "short", day: "numeric" },
    ).format(date);
  };

  if (loading || articles.length === 0) return null;

  return (
    <section
      aria-label="Latest Zenn articles"
      className="bg-[color:var(--color-paper)] border-b border-[color:var(--color-rule-soft)]"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-3">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="kicker">{t("latestPost")}</span>
          <span className="kicker text-[color:var(--color-amber-mark)]">●</span>
        </div>
        <ul className="divide-y divide-[color:var(--color-rule-soft)]">
          {articles.map((a, i) => (
            <li key={i}>
              <Link
                href={a.link}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-edit grid grid-cols-[5rem_1fr_auto] items-baseline gap-3 py-2 group"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[color:var(--color-ink-soft)]">
                  {formatDate(a.pubDate)}
                </span>
                <span className="text-sm font-semibold tracking-tight text-[color:var(--color-ink)] group-hover:text-[color:var(--color-amber-mark)] truncate">
                  {a.title}
                </span>
                <ArrowUpRight
                  size={14}
                  className="text-[color:var(--color-ink-soft)] group-hover:text-[color:var(--color-amber-mark)] transition-colors"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
