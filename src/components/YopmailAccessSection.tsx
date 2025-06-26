"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Mail, Copy, ExternalLink, Sparkles, ArrowRight, CheckCircle } from "lucide-react";

const YopmailAccessSection = () => {
  const t = useTranslations("yopmail");
  const [username, setUsername] = useState("");
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
      // Create the Yopmail URL
      const yopmailUrl = `https://yopmail.com?${username}`;
      
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: yopmailUrl,
          customPath: `mail-${username}`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`${t("error.failed")} (${response.status})`);
      }

      const data = await response.json();
      setShortUrl(data.shortUrl);
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

  const openYopmailDirect = () => {
    window.open(`https://yopmail.com?${username}`, '_blank');
  };

  return (
    <section id="yopmail" className="py-20 sm:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6">
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
                htmlFor="username"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                {t("form.usernameLabel")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                  placeholder={t("form.usernamePlaceholder")}
                  className="w-full pl-10 pr-20 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-900 dark:text-white transition-all duration-200"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">
                  @ryosh.in
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t("form.usernameHint")}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading || !username}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-700 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? t("form.generating") : t("form.createShortUrl")}
              </button>
              
              <button
                type="button"
                onClick={openYopmailDirect}
                disabled={!username}
                className="px-6 py-3 border border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400 font-semibold rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight size={18} />
              </button>
            </div>
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
              className="mt-6 p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("result.title")}
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                    {t("result.emailAddress")}
                  </p>
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <span className="flex-1 text-sm font-mono">
                      {username}@ryosh.in
                    </span>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                    {t("result.shortUrl")}
                  </p>
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <span className="flex-1 text-sm font-mono truncate">
                      {shortUrl}
                    </span>
                    <button
                      onClick={copyToClipboard}
                      className="p-1 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      title={t("result.copy")}
                    >
                      <Copy size={16} />
                    </button>
                    <a
                      href={shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      title={t("result.open")}
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
              
              {copied && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                  {t("result.copied")}
                </p>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
              {t("info.title")}
            </h3>
            <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
              <li>• {t("info.unlimited")}</li>
              <li>• {t("info.noPassword")}</li>
              <li>• {t("info.retention")}</li>
              <li>• {t("info.forwarding")}</li>
            </ul>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400"
        >
          <p>{t("footer.info")}</p>
          <p className="mt-2 font-mono text-xs">
            Powered by Yopmail + link.ryosh.in • {t("footer.madeWith")} ❤️
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default YopmailAccessSection; 