"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link2, Copy, ExternalLink, Sparkles } from "lucide-react";

const URLShortenerSection = () => {
  const t = useTranslations("urlshortener");
  const [longUrl, setLongUrl] = useState("");
  const [customPath, setCustomPath] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setShortUrl("");

    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: longUrl,
          customPath: customPath || undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`${t("error.failed")} (${response.status})`);
      }

      const data = await response.json();
      setShortUrl(data.shortUrl);
      setLongUrl("");
      setCustomPath("");
    } catch (err) {
      console.error("Fetch error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("error.unknown"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <section id="urlshortener" className="py-20 sm:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
            <Sparkles size={16} />
            {t("badge")}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-4">
            {t("title")}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 sm:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="longUrl"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                {t("form.urlLabel")}
              </label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  id="longUrl"
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  placeholder={t("form.urlPlaceholder")}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white transition-all duration-200"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="customPath"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                {t("form.customPathLabel")}
                <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">
                  {t("form.optional")}
                </span>
              </label>
              <input
                type="text"
                id="customPath"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder={t("form.customPathPlaceholder")}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? t("form.generating") : t("form.submit")}
            </button>
          </form>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </motion.div>
          )}

          {shortUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t("result.title")}
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={shortUrl}
                  readOnly
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title={t("result.copy")}
                >
                  <Copy size={18} />
                </button>
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title={t("result.open")}
                >
                  <ExternalLink size={18} />
                </a>
              </div>
              {copied && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  {t("result.copied")}
                </p>
              )}
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400"
        >
          <p>{t("footer.info")}</p>
          <p className="mt-2 font-mono text-xs">
            link.ryosh.in • {t("footer.madeWith")} ❤️
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default URLShortenerSection;