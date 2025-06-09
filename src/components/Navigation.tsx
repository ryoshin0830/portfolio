"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useParams } from "next/navigation";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import Image from "next/image";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const t = useTranslations("nav");
  const langT = useTranslations("languages");

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

  const navItems = useMemo(() => [
    { key: "home", path: "" },
    { key: "about", path: "about" },
    { key: "research", path: "research" },
    { key: "skills", path: "skills" },
    { key: "projects", path: "projects" },
    { key: "gallery", path: "gallery" },
  ], []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update active section based on current pathname
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const routeSegment = segments[0] && ["ja","en","zh"].includes(segments[0]) ? segments[1] ?? "" : segments[0] ?? "";
    setActiveSection(routeSegment === "" ? "home" : routeSegment);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLangMenu && !(event.target as Element).closest('.language-menu')) {
        setShowLangMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLangMenu]);

  const handleLanguageChange = (langCode: string) => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && ["ja", "en", "zh"].includes(segments[0])) {
      segments.shift();
    }
    const newPath = `/${langCode}${segments.length > 0 ? "/" + segments.join("/") : ""}`;
    router.push(newPath);
    setShowLangMenu(false);
  };

  const navigateTo = (path: string) => {
    const fullPath = `/${locale}${path ? "/" + path : ""}`;
    router.push(fullPath);
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
            onClick={() => navigateTo("")}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-md opacity-75" />
              <Image
                src="/logo.svg"
                alt="Logo"
                width={48}
                height={48}
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
            {navItems.map((item) => (
              <motion.button
                key={item.key}
                onClick={() => navigateTo(item.path)}
                className={`relative px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                  activeSection === (item.path || "home")
                    ? "text-white"
                    : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {activeSection === (item.path || "home") && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                    layoutId="activeNavItem"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t(item.key)}</span>
              </motion.button>
            ))}
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
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.key}
                    onClick={() => navigateTo(item.path)}
                    className={`block w-full text-left px-6 py-4 rounded-xl mb-2 font-semibold transition-all duration-300 ${
                      activeSection === (item.path || "home")
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    }`}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 4 }}
                  >
                    {t(item.key)}
                  </motion.button>
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
