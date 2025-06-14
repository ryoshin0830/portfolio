"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ExternalLink, Calendar, User, BookOpen } from "lucide-react";
import Link from "next/link";

interface ZennArticle {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  creator: string;
}

export default function ZennFeed() {
  const t = useTranslations("zennFeed");
  const [articles, setArticles] = useState<ZennArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchZennArticles();
  }, []);

  const fetchZennArticles = async () => {
    try {
      // ZennのRSSフィードURL
      const RSS_URL = "https://zenn.dev/ryoushin/feed";
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`);
      
      if (!response.ok) throw new Error("Failed to fetch");
      
      const data = await response.json();
      
      if (data.items) {
        const formattedArticles: ZennArticle[] = data.items.slice(0, 6).map((item: { title: string; link: string; pubDate: string; description?: string; author?: string }) => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          description: item.description || "",
          creator: item.author || "梁震",
        }));
        
        setArticles(formattedArticles);
      }
    } catch (err) {
      console.error("Error fetching Zenn articles:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  if (loading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-full animate-pulse">
              <BookOpen size={20} />
              <span>{t("loading")}</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || articles.length === 0) {
    return null;
  }

  return (
    <section id="blog" className="py-20 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            {t("title")}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Featured Article */}
        {articles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
          >
            <Link
              href={articles[0].link}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="relative p-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-3xl shadow-2xl overflow-hidden group hover:shadow-3xl transition-all duration-300">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
                
                <div className="relative z-10 text-white">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                      {t("featured")}
                    </span>
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm">
                      {formatDate(articles[0].pubDate)}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 group-hover:underline decoration-2 underline-offset-4">
                    {articles[0].title}
                  </h3>
                  
                  <div
                    className="text-white/80 mb-6 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: articles[0].description }}
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span className="text-sm">{articles[0].creator}</span>
                    </div>
                    <div className="flex items-center gap-2 group-hover:gap-3 transition-all">
                      <span className="text-sm font-semibold">{t("readMore")}</span>
                      <ExternalLink size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Article Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {articles.slice(1).map((article, index) => (
            <motion.article
              key={index}
              variants={itemVariants}
              className="group"
            >
              <Link
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
              >
                <div className="h-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <Calendar size={14} />
                    <span>{formatDate(article.pubDate)}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  
                  <div
                    className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 text-sm"
                    dangerouslySetInnerHTML={{ __html: article.description }}
                  />
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <User size={14} />
                      <span>{article.creator}</span>
                    </div>
                    <ExternalLink
                      size={16}
                      className="text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors"
                    />
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </motion.div>

        {/* View More Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <Link
            href="https://zenn.dev/ryoushin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            <span>{t("viewAllArticles")}</span>
            <ExternalLink size={18} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}