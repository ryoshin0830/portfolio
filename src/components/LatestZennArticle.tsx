"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { RiSparklingFill, RiArrowRightUpLine } from "react-icons/ri";
import Link from "next/link";

interface ZennArticle {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  creator: string;
}

type Rss2JsonItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  author?: string;
};

type Rss2JsonResponse = {
  items?: Rss2JsonItem[];
};

export default function LatestZennArticle() {
  const t = useTranslations("heroZenn");
  const locale = useLocale();
  const [articles, setArticles] = useState<ZennArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchLatestArticles = async () => {
      try {
        const RSS_URL = "https://zenn.dev/ryoushin/feed";
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`);
        
        if (!response.ok) throw new Error("Failed to fetch");
        
        const data = (await response.json()) as Rss2JsonResponse;
        
        if (Array.isArray(data.items) && data.items.length > 0) {
          const latestItems = data.items
            .filter(
              (item): item is Required<Pick<Rss2JsonItem, "title" | "link" | "pubDate">> &
                Omit<Rss2JsonItem, "title" | "link" | "pubDate"> =>
                typeof item.title === "string" &&
                typeof item.link === "string" &&
                typeof item.pubDate === "string",
            )
            .slice(0, 3)
            .map((item) => ({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              description: item.description || "",
              creator: item.author || "梁震",
            }));
          setArticles(latestItems);
        }
      } catch (err) {
        console.error("Error fetching latest Zenn articles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestArticles();
  }, []);

  useEffect(() => {
    if (articles.length > 0 && !loading) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [articles, loading]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return t("today");
    if (diffDays <= 7) return t("daysAgo", { days: diffDays });
    
    return new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : locale === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  if (loading || articles.length === 0) return null;

  return (
    <section className={`relative overflow-hidden transition-all duration-700 ${visible ? 'opacity-100' : 'opacity-0'} -mt-8`}>
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto space-y-1">
          {articles.map((article, index) => (
            <Link 
              key={index}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div 
                className={`relative transition-all duration-500 ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ 
                  transitionDelay: `${index * 100}ms`
                }}
              >
                <div className="relative flex items-center gap-3 py-2 px-2 group rounded-lg transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-900">
                  {/* Animated sparkle icon - only on first item */}
                  {index === 0 && (
                    <div className="relative flex-shrink-0">
                      <RiSparklingFill className={`w-4 h-4 text-blue-500 dark:text-blue-400 transition-all duration-500 ${hoveredIndex === 0 ? 'scale-110' : ''}`} />
                    </div>
                  )}
                  
                  {/* Index number for items 2 and 3 */}
                  {index > 0 && (
                    <span className={`flex-shrink-0 w-4 h-4 text-xs font-medium text-slate-400 dark:text-slate-500 transition-all duration-300 ${hoveredIndex === index ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                      {index + 1}.
                    </span>
                  )}

                  {/* Content - horizontal layout */}
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    {/* Date badge */}
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full transition-all duration-300 ${
                      index === 0 
                        ? `bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ${hoveredIndex === 0 ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`
                        : `bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ${hoveredIndex === index ? 'bg-slate-200 dark:bg-slate-700' : ''}`
                    }`}>
                      {formatDate(article.pubDate)}
                    </span>

                    {/* Title with overflow handling */}
                    <h3 className={`flex-1 text-sm font-medium truncate transition-all duration-300 ${
                      index === 0
                        ? `text-slate-800 dark:text-slate-200 ${hoveredIndex === 0 ? 'text-slate-900 dark:text-white' : ''}`
                        : `text-slate-600 dark:text-slate-400 ${hoveredIndex === index ? 'text-slate-800 dark:text-slate-200' : ''}`
                    }`}>
                      {article.title}
                    </h3>

                    {/* Arrow icon with animation */}
                    <RiArrowRightUpLine className={`flex-shrink-0 w-4 h-4 transition-all duration-300 ${
                      hoveredIndex === index 
                        ? 'text-blue-600 dark:text-blue-400 translate-x-1 -translate-y-1' 
                        : 'text-slate-400 dark:text-slate-500 opacity-60'
                    }`} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
