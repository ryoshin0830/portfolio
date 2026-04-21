"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface ZennArticle {
  title: string;
  link: string;
  pubDate: string;
}

export default function LatestZennArticle() {
  const t = useTranslations("heroZenn");
  const [article, setArticle] = useState<ZennArticle | null>(null);
  const [loading, setLoading] = useState(true);

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
        if (data.items && data.items.length > 0 && !cancelled) {
          const i = data.items[0];
          setArticle({ title: i.title, link: i.link, pubDate: i.pubDate });
        }
      } catch (err) {
        console.error("Error fetching latest Zenn article:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !article) return null;

  return (
    <section
      aria-label="Latest article"
      className="bg-[color:var(--color-bg-soft)] border-y border-[color:var(--color-rule-soft)]"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-4">
        <Link
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-baseline gap-4 group"
        >
          <span className="text-xs uppercase tracking-wider text-[color:var(--color-ink-muted)] font-medium shrink-0">
            {t("latestPost")}
          </span>
          <span className="flex-1 text-sm md:text-base font-medium text-[color:var(--color-ink)] group-hover:text-[color:var(--color-accent)] truncate transition-colors">
            {article.title}
          </span>
          <ArrowUpRight
            size={14}
            className="text-[color:var(--color-ink-muted)] group-hover:text-[color:var(--color-accent)] transition-colors shrink-0"
          />
        </Link>
      </div>
    </section>
  );
}
