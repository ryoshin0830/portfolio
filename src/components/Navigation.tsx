"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { m, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useParams } from "next/navigation";
import { Menu, X, Moon, Sun } from "lucide-react";
import Image from "next/image";
import { useScrollNavigation } from "@/hooks/useScrollNavigation";
import { useTheme } from "@/contexts/ThemeContext";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const t = useTranslations("nav");
  const langT = useTranslations("languages");
  const namesT = useTranslations("names");
  const { theme, toggleTheme, mounted } = useTheme();
  
  const { currentSection, scrollToSection } = useScrollNavigation();

  const params = useParams<{ locale?: string }>();
  const defaultLocale = useLocale();
  const localeParam = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: string = localeParam ?? defaultLocale;
  const pathname = usePathname();
  const router = useRouter();

  // Priority-based navigation: 最重要の5項目のみヘッダーに表示
  const primaryNavItems = [
    { key: "home", sectionId: "hero" },
    { key: "about", sectionId: "about" },
    { key: "research", sectionId: "research" },
    { key: "skills", sectionId: "skills" },
    { key: "projects", sectionId: "projects" },
  ];

  // ハンバーガーメニューに表示するセカンダリナビゲーション
  const secondaryNavItems = [
    { key: "blog", sectionId: "blog", category: "content" },
    { key: "teaching", sectionId: "teaching", category: "experience" },
  ];

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (showMoreMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMoreMenu]);

  const getLanguageName = useCallback((code: string): string => {
    try {
      const translated = langT(code);
      if (translated && translated !== code) {
        return translated;
      }
    } catch (error) {
      console.warn(`Translation error for ${code}:`, error);
    }
    
    const fallbackNames = { ja: "日本語", en: "English", zh: "中文" };
    return fallbackNames[code as keyof typeof fallbackNames] || code;
  }, [langT]);

  const getFlag = useCallback((code: string): string => {
    const flags = { ja: "🇯🇵", en: "🇬🇧", zh: "🇨🇳" };
    return flags[code as keyof typeof flags] || "🌍";
  }, []);

  const languages = [
    { code: "ja", name: getLanguageName("ja"), flag: getFlag("ja") },
    { code: "en", name: getLanguageName("en"), flag: getFlag("en") },
    { code: "zh", name: getLanguageName("zh"), flag: getFlag("zh") },
  ];

  useEffect(() => {
    let ticking = false;
    let rafId: number;
    const handleScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          const shouldBeScrolled = window.scrollY > 50;
          setIsScrolled(prev => prev === shouldBeScrolled ? prev : shouldBeScrolled);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const activeSection = currentSection;

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

  const navigateTo = (sectionId: string) => {
    scrollToSection(sectionId);
    setShowMoreMenu(false);
  };

  return (
    <>
      <m.nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          isScrolled
            ? "bg-white dark:bg-slate-950 shadow-lg border-b border-slate-200/20 dark:border-slate-800/20"
            : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4 }}
      >
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 max-w-7xl">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo */}
          <m.div
            className="flex items-center gap-2 sm:gap-4 cursor-pointer"
            onClick={() => navigateTo("hero")}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="relative w-[28px] h-[28px] sm:w-[36px] sm:h-[36px]">
              <div className="absolute inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-md opacity-70" />
              <Image
                src="/logo.svg"
                alt="Logo"
                width={24}
                height={24}
                sizes="36px"
                className="relative rounded-full border-2 border-white dark:border-slate-800 shadow-lg sm:w-8 sm:h-8"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                {namesT("shortName")}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                {namesT("english")}
              </p>
            </div>
          </m.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {/* Primary Navigation Items */}
            {primaryNavItems.map((item) => (
              <m.div
                key={item.key}
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {activeSection === item.sectionId && (
                  <m.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                <button
                  className={`relative z-10 px-2 lg:px-3 xl:px-4 py-1.5 lg:py-2 xl:py-2.5 rounded-full font-medium text-xs lg:text-sm transition-all duration-300 ${
                    activeSection === item.sectionId
                      ? "text-white"
                      : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                  onClick={() => navigateTo(item.sectionId)}
                >
                  {t(item.key)}
                </button>
              </m.div>
            ))}

            {/* Hamburger Menu Button */}
            <m.button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`p-2 lg:p-3 rounded-full transition-all duration-300 ${
                secondaryNavItems.some(item => activeSection === item.sectionId)
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu size={16} className="lg:w-5 lg:h-5" />
            </m.button>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
            {/* Theme Toggle */}
            <m.button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 lg:p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle dark mode"
            >
              {mounted ? (
                <AnimatePresence mode="wait">
                  {theme === "dark" ? (
                    <m.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Sun size={14} className="sm:w-[18px] sm:h-[18px] lg:w-5 lg:h-5" />
                    </m.div>
                  ) : (
                    <m.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Moon size={14} className="sm:w-[18px] sm:h-[18px] lg:w-5 lg:h-5" />
                    </m.div>
                  )}
                </AnimatePresence>
              ) : (
                <div className="w-[14px] h-[14px] sm:w-[18px] sm:h-[18px] lg:w-5 lg:h-5" />
              )}
            </m.button>

            {/* Language Selector */}
            <div className="relative language-menu">
              <m.button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-sm sm:text-base lg:text-lg">
                  {languages.find(lang => lang.code === locale)?.flag || "🌍"}
                </span>
                <span className="hidden sm:block text-xs lg:text-sm font-medium truncate max-w-16 lg:max-w-none">
                  {languages.find(lang => lang.code === locale)?.name || locale.toUpperCase()}
                </span>
              </m.button>

              <AnimatePresence>
                {showLangMenu && (
                  <m.div
                    className="absolute top-full right-0 mt-2 py-2 w-32 sm:w-40 lg:w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {languages.map((language) => (
                      <m.button
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        className={`w-full text-left px-3 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm font-medium transition-all duration-200 ${
                          locale === language.code
                            ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        }`}
                        whileHover={{ x: 4 }}
                      >
                        <span className="flex items-center gap-2 lg:gap-3">
                          <span className="text-sm lg:text-lg">{language.flag}</span>
                          <span className="truncate">{language.name}</span>
                        </span>
                      </m.button>
                    ))}
                  </m.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <m.button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="lg:hidden p-1.5 sm:p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu size={14} className="sm:w-[18px] sm:h-[18px]" />
            </m.button>
          </div>
        </div>

        </div>
      </m.nav>

      {/* Full Screen Menu Portal - Outside Navigation */}
      <AnimatePresence>
        {showMoreMenu && (
          <m.div
            className="fixed inset-0 bg-white dark:bg-slate-950"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              zIndex: 100000
            }}
          >
            
            {/* Close Button */}
            <div className="absolute top-6 right-6 z-[100001]">
              <m.button
                onClick={() => setShowMoreMenu(false)}
                className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 shadow-2xl border border-slate-200/50 dark:border-slate-700/50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={24} />
              </m.button>
            </div>

            <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
              <m.div
                className="text-center w-full max-w-4xl lg:max-w-6xl"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                {/* Mobile Simple Menu */}
                <div className="block lg:hidden">
                  <div className="space-y-3 sm:space-y-4 max-w-xs sm:max-w-sm mx-auto">
                    {[...primaryNavItems, ...secondaryNavItems].map((item, index) => (
                      <m.button
                        key={item.key}
                        onClick={() => navigateTo(item.sectionId)}
                        className={`block w-full text-center px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 ${
                          activeSection === item.sectionId
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                      >
                        {t(item.key)}
                      </m.button>
                    ))}
                  </div>
                </div>

                {/* Desktop Simple Menu */}
                <div className="hidden lg:block">
                  {/* Menu Title */}
                  <m.h2
                    className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-12 sm:mb-16"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    Menu
                  </m.h2>

                  {/* All Navigation Items in Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-2xl md:max-w-4xl mx-auto">
                    {[...primaryNavItems, ...secondaryNavItems].map((item, index) => (
                      <m.button
                        key={item.key}
                        onClick={() => {
                          navigateTo(item.sectionId);
                          setShowMoreMenu(false);
                        }}
                        className={`p-4 sm:p-6 rounded-2xl text-lg sm:text-xl font-semibold transition-all duration-300 ${
                          activeSection === item.sectionId
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50"
                        }`}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                      >
                        {t(item.key)}
                      </m.button>
                    ))}
                  </div>
                </div>
              </m.div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;