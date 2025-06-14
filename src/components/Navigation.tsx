"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useParams } from "next/navigation";
import { Menu, X, Globe, ChevronDown, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { useScrollNavigation } from "@/hooks/useScrollNavigation";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const t = useTranslations("nav");
  const langT = useTranslations("languages");
  
  // スクロールナビゲーションのフック
  const { currentSection, scrollToSection } = useScrollNavigation();

  // Prefer the locale found in the current URL (e.g. /en, /ja, /zh) to avoid
  // situations where the context value lags behind after a client-side
  // navigation. Fall back to the context-provided locale when the parameter
  // is absent.
  const params = useParams<{ locale?: string }>();
  const defaultLocale = useLocale();
  const localeParam = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: string = localeParam ?? defaultLocale;
  const pathname = usePathname();
  const router = useRouter();

  // Define language names with proper fallback
  const getLanguageName = useCallback((code: string): string => {
    try {
      const translated = langT(code);
      // Check if translation is valid and not empty
      if (translated && translated !== code) {
        return translated;
      }
    } catch (error) {
      console.warn(`Translation error for ${code}:`, error);
    }
    
    // Fallback to hardcoded names
    const fallbackNames = { ja: "日本語", en: "English", zh: "中文" };
    return fallbackNames[code as keyof typeof fallbackNames] || code;
  }, [langT]);

  // Return the flag corresponding to each language code.
  // This mapping is independent of the current locale, ensuring each language
  // is always represented by the same emoji flag.
  const getFlag = useCallback((code: string): string => {
    const flagMap: Record<string, string> = { ja: "🇯🇵", en: "🇺🇸", zh: "🇨🇳" };
    return flagMap[code] ?? "🌐";
  }, []);

  const languages = useMemo(() => {
    console.log('Regenerating languages for locale:', locale);
    const result = [
      { code: "ja", name: getLanguageName("ja"), flag: getFlag("ja") },
      { code: "en", name: getLanguageName("en"), flag: getFlag("en") },
      { code: "zh", name: getLanguageName("zh"), flag: getFlag("zh") },
    ];
    console.log('Generated languages:', result);
    return result;
  }, [getLanguageName, getFlag, locale]);

  const primaryNavItems = useMemo(() => [
    { key: "home", sectionId: "hero" },
    { key: "about", sectionId: "about" },
    { key: "research", sectionId: "research" },
    { key: "skills", sectionId: "skills" },
    { key: "projects", sectionId: "projects" },
    { key: "blog", sectionId: "blog" },
  ], []);

  const secondaryNavItems = useMemo(() => [
    { key: "certifications", sectionId: "certifications" },
    { key: "teaching", sectionId: "teaching" },
    { key: "gallery", sectionId: "gallery" },
  ], []);

  const allNavItems = useMemo(() => [...primaryNavItems, ...secondaryNavItems], [primaryNavItems, secondaryNavItems]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // アクティブセクションは useScrollNavigation から取得
  const activeSection = currentSection;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLangMenu && !(event.target as Element).closest('.language-menu')) {
        setShowLangMenu(false);
      }
      if (showMoreMenu && !(event.target as Element).closest('.more-menu')) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLangMenu, showMoreMenu]);

  const handleLanguageChange = (langCode: string) => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && ["ja", "en", "zh"].includes(segments[0])) {
      segments.shift();
    }
    const newPath = `/${langCode}${segments.length > 0 ? "/" + segments.join("/") : ""}`;
    router.push(newPath);
    setShowLangMenu(false);
  };

  const navigateTo = (sectionId: string) => {
    scrollToSection(sectionId);
    setIsOpen(false);
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-lg border-b border-slate-200/20 dark:border-slate-800/20"
          : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-4 cursor-pointer"
            onClick={() => navigateTo("hero")}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="relative w-[36px] h-[36px]">
              <div className="absolute inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-md opacity-70" />
              <Image
                src="/logo.svg"
                alt="Logo"
                width={32}
                height={32}
                className="relative rounded-full border-2 border-white dark:border-slate-800 shadow-lg"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                梁震
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                RYO SHIN
              </p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Primary Navigation Items */}
            {primaryNavItems.map((item) => (
              <motion.div
                key={item.key}
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {activeSection === item.sectionId && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                    layoutId="activeNavItem"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <button
                  className={`relative z-10 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                    activeSection === item.sectionId
                      ? "text-white"
                      : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                  onClick={() => navigateTo(item.sectionId)}
                >
                  {t(item.key)}
                </button>
              </motion.div>
            ))}

            {/* More Menu */}
            <div className="relative more-menu">
              <motion.button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`flex items-center gap-1 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                  secondaryNavItems.some(item => activeSection === item.sectionId)
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MoreHorizontal size={18} />
                <span>{t("more")}</span>
                <ChevronDown 
                  size={14} 
                  className={`transition-transform duration-200 ${showMoreMenu ? 'rotate-180' : ''}`}
                />
              </motion.button>

              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div
                    className="absolute top-full right-0 mt-2 py-2 w-56 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {secondaryNavItems.map((item) => (
                      <motion.button
                        key={item.key}
                        onClick={() => {
                          navigateTo(item.sectionId);
                          setShowMoreMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-all duration-200 ${
                          activeSection === item.sectionId
                            ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        }`}
                        whileHover={{ x: 4 }}
                      >
                        <span className="flex items-center gap-2">
                          {t(item.key)}
                        </span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative language-menu">
              <motion.button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Globe size={18} />
                <span className="text-lg">
                  {languages.find((lang) => lang.code === locale)?.flag}
                </span>
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-200 ${showLangMenu ? 'rotate-180' : ''}`}
                />
              </motion.button>

              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    className="absolute top-full right-0 mt-2 py-3 w-48 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {languages.map((lang) => (
                      <motion.button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-all duration-200 ${
                          locale === lang.code
                            ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        }`}
                        whileHover={{ x: 4 }}
                      >
                        <span className="mr-3 text-lg">{lang.flag}</span>
                        {lang.name}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-3 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="lg:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl border-t border-slate-200/20 dark:border-slate-800/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="py-6 px-6">
                {allNavItems.map((item, index) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 4 }}
                  >
                    <button
                      className={`block w-full text-left px-6 py-4 rounded-xl mb-2 font-semibold transition-all duration-300 ${
                        activeSection === item.sectionId
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                      }`}
                      onClick={() => navigateTo(item.sectionId)}
                    >
                      {t(item.key)}
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navigation;
