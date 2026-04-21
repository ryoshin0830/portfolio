"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { m, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useParams } from "next/navigation";
import { Menu, X, Moon, Sun } from "lucide-react";
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

  const primaryNavItems = [
    { key: "about", sectionId: "about" },
    { key: "experience", sectionId: "experience" },
    { key: "projects", sectionId: "projects" },
    { key: "research", sectionId: "research" },
    { key: "skills", sectionId: "skills" },
    { key: "teaching", sectionId: "teaching" },
  ];
  const secondaryNavItems = [
    { key: "blog", sectionId: "blog" },
    { key: "contact", sectionId: "contact" },
  ];

  useEffect(() => {
    document.body.style.overflow = showMoreMenu ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showMoreMenu]);

  const getLanguageName = useCallback(
    (code: string): string => {
      try {
        const translated = langT(code);
        if (translated && translated !== code) return translated;
      } catch (e) {
        console.warn(`Translation error for ${code}:`, e);
      }
      const fallback = { ja: "日本語", en: "English", zh: "中文" };
      return fallback[code as keyof typeof fallback] || code;
    },
    [langT],
  );

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
    const onScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 30);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (showLangMenu && !(e.target as Element).closest(".language-menu")) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
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

  const isHomePage = (() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return true;
    if (segments.length === 1 && ["ja", "en", "zh"].includes(segments[0])) return true;
    if (
      segments.length === 2 &&
      ["ja", "en", "zh"].includes(segments[0]) &&
      [...primaryNavItems, ...secondaryNavItems].some((it) => it.sectionId === segments[1])
    ) {
      return true;
    }
    return false;
  })();

  const navigateTo = (sectionId: string) => {
    setShowMoreMenu(false);
    if (isHomePage) {
      scrollToSection(sectionId);
    } else {
      const target = sectionId === "hero" ? `/${locale}` : `/${locale}#${sectionId}`;
      router.push(target);
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-colors ${
          isScrolled
            ? "bg-[color:var(--color-bg)]/85 backdrop-blur-xl border-b border-[color:var(--color-rule-soft)]"
            : "bg-transparent"
        }`}
        style={{ WebkitBackdropFilter: isScrolled ? "blur(20px)" : "none" }}
      >
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-center justify-between h-12 lg:h-14">
            <button
              type="button"
              onClick={() => navigateTo("hero")}
              className="text-base font-semibold tracking-tight text-[color:var(--color-ink)]"
            >
              {namesT("shortName")}
            </button>

            <div className="hidden lg:flex items-center gap-7 text-sm">
              {primaryNavItems.map((item) => {
                const active = currentSection === item.sectionId;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => navigateTo(item.sectionId)}
                    className={`relative pb-0.5 transition-colors font-medium ${
                      active
                        ? "text-[color:var(--color-accent)]"
                        : "text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]"
                    }`}
                  >
                    {t(item.key)}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)] transition-colors"
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
                        <Sun size={16} />
                      </m.div>
                    ) : (
                      <m.div
                        key="moon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Moon size={16} />
                      </m.div>
                    )}
                  </AnimatePresence>
                ) : (
                  <div className="w-4 h-4" />
                )}
              </button>

              <div className="relative language-menu">
                <button
                  type="button"
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)] transition-colors"
                >
                  <span className="text-base">{languages.find((l) => l.code === locale)?.flag}</span>
                  <span className="hidden sm:inline">
                    {locale.toUpperCase()}
                  </span>
                </button>
                <AnimatePresence>
                  {showLangMenu && (
                    <m.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 py-1 w-40 bg-[color:var(--color-bg)] border border-[color:var(--color-rule)] rounded-lg shadow-lg"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            locale === lang.code
                              ? "text-[color:var(--color-accent)]"
                              : "text-[color:var(--color-ink)] hover:bg-[color:var(--color-bg-soft)]"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                          </span>
                        </button>
                      ))}
                    </m.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="lg:hidden p-2 text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)] transition-colors"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {showMoreMenu && (
          <m.div
            className="fixed inset-0 bg-[color:var(--color-bg)] z-[100000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute top-4 right-4">
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="p-2 text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center min-h-screen p-6">
              <ul className="space-y-4 text-center">
                {[...primaryNavItems, ...secondaryNavItems].map((item) => {
                  const active = currentSection === item.sectionId;
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => navigateTo(item.sectionId)}
                        className={`text-3xl md:text-4xl font-semibold tracking-tight transition-colors ${
                          active
                            ? "text-[color:var(--color-accent)]"
                            : "text-[color:var(--color-ink)] hover:text-[color:var(--color-accent)]"
                        }`}
                      >
                        {t(item.key)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;
