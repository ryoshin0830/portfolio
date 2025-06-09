"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import Image from "next/image";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const languages = [
    { code: "ja", name: "日本語", flag: "🇯🇵" },
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "zh", name: "中文", flag: "🇨🇳" },
  ];

  const navItems = [
    { key: "home", href: "#hero" },
    { key: "about", href: "#about" },
    { key: "research", href: "#research" },
    { key: "skills", href: "#skills" },
    { key: "projects", href: "#projects" },
    { key: "gallery", href: "#gallery" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    // Get current pathname without locale
    const segments = pathname.split("/").filter(Boolean);

    // Remove the current locale from the path if it exists
    if (segments.length > 0 && ["ja", "en", "zh"].includes(segments[0])) {
      segments.shift();
    }

    // Build the new path with the selected locale
    const newPath = `/${langCode}${segments.length > 0 ? "/" + segments.join("/") : ""}`;

    // Force a full page reload to ensure the locale change is reflected
    window.location.href = newPath;
    setShowLangMenu(false);
  };

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      data-oid="411p9zs"
    >
      <div className="container mx-auto px-4" data-oid="tn3nnon">
        <div
          className="flex items-center justify-between h-16"
          data-oid=":soxb78"
        >
          {/* Logo */}
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            data-oid="z:zxyy:"
          >
            <Image
              src="/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-full"
              data-oid="dzq59eu"
            />

            <div className="hidden sm:block" data-oid="h5i1uh4">
              <h1
                className="text-lg font-bold text-slate-800 dark:text-white"
                data-oid="ckrhzmw"
              >
                梁震
              </h1>
              <p
                className="text-xs text-slate-600 dark:text-slate-400"
                data-oid="7z7s5qt"
              >
                RYO SHIN
              </p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div
            className="hidden md:flex items-center space-x-8"
            data-oid="lgkmxk8"
          >
            {navItems.map((item) => (
              <motion.button
                key={item.key}
                onClick={() => scrollToSection(item.href)}
                className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                data-oid="1p-toup"
              >
                {t(item.key)}
              </motion.button>
            ))}
          </div>

          {/* Language Selector & Mobile Menu */}
          <div className="flex items-center space-x-4" data-oid="csbzhpp">
            {/* Language Selector */}
            <div className="relative" data-oid="hjeanio">
              <motion.button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                data-oid="_wj2.:l"
              >
                <Globe size={16} data-oid="koxy6b_" />
                <span className="text-sm font-medium" data-oid="wi3e2zt">
                  {languages.find((lang) => lang.code === locale)?.flag}
                </span>
                <ChevronDown size={14} data-oid=":cmymfe" />
              </motion.button>

              <AnimatePresence data-oid="6dq_314">
                {showLangMenu && (
                  <motion.div
                    className="absolute top-full right-0 mt-2 py-2 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-60"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    data-oid="4v8dsy2"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 ${
                          locale === lang.code
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                        data-oid="rh949jk"
                      >
                        <span className="mr-2" data-oid="ojuv3.t">
                          {lang.flag}
                        </span>
                        {lang.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-oid="9pv9ihm"
            >
              {isOpen ? (
                <X size={20} data-oid="0t_i3xx" />
              ) : (
                <Menu size={20} data-oid="04i7lek" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence data-oid="px-v7wd">
          {isOpen && (
            <motion.div
              className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 shadow-lg border-t border-slate-200 dark:border-slate-700 z-60"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              data-oid="2nu_8no"
            >
              <div className="py-4" data-oid=":945vts">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.key}
                    onClick={() => scrollToSection(item.href)}
                    className="block w-full text-left px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 font-medium"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    data-oid="ncrhh9r"
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
