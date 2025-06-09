"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowDown, Github, Twitter, Mail } from "lucide-react";
import Image from "next/image";

const HeroSection = () => {
  const [currentNameIndex, setCurrentNameIndex] = useState(0);
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const t = useTranslations("hero");

  const names = ["梁 震", "りょう しん", "RYO SHIN", "LIANG ZHEN"];
  const roles = t.raw("roles") as string[];

  // Email components (obfuscation)
  const emailUser = "ryo.shin.j85";
  const emailDomain = "kyoto-u.jp";

  // Handler to construct mailto link at runtime
  const handleEmailClick = () => {
    const email = `${emailUser}@${emailDomain}`;
    const subject = encodeURIComponent(t("email_subject"));
    const body = encodeURIComponent(t("email_body"));
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  useEffect(() => {
    const nameInterval = setInterval(() => {
      setCurrentNameIndex((prev) => (prev + 1) % names.length);
    }, 4000);
    return () => clearInterval(nameInterval);
  }, [names.length]);

  useEffect(() => {
    const roleInterval = setInterval(() => {
      setCurrentRoleIndex((prev) => (prev + 1) % roles.length);
    }, 3500);
    return () => clearInterval(roleInterval);
  }, [roles.length]);

  const scrollToNext = () => {
    const aboutSection = document.querySelector("#about");
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/10" />
      
      {/* Minimal background elements */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-400/10 rounded-full blur-2xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-5xl mx-auto pt-32">

          {/* Name */}
          <div className="mb-12">
            <AnimatePresence mode="wait">
              <motion.h1
                key={currentNameIndex}
                className="text-5xl md:text-7xl lg:text-8xl font-black gradient-text mb-4 tracking-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {names[currentNameIndex]}
              </motion.h1>
            </AnimatePresence>
          </div>

          {/* Role */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent flex-1 max-w-32" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentRoleIndex}
                  className="relative px-8 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-blue-200/50 dark:border-blue-700/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {roles[currentRoleIndex]}
                  </span>
                </motion.div>
              </AnimatePresence>
              <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent flex-1 max-w-32" />
            </div>
          </div>

          {/* Subtitle */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl text-slate-700 dark:text-slate-300 mb-6 font-light tracking-wide">
            {t("subtitle")}
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-16 max-w-3xl mx-auto leading-relaxed">
            {t("description")}
          </p>

          {/* Contact Section */}
          <div className="mb-20">
            {/* Primary Email CTA */}
            <button
              onClick={handleEmailClick}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 mb-8"
            >
              <Mail size={22} />
              <span>{t("connect")}</span>
            </button>

            {/* Social Links */}
            <div className="flex items-center justify-center gap-4">
              <a
                href="https://github.com/ryoshin0830"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600"
              >
                <Github size={24} className="text-slate-700 dark:text-slate-300" />
              </a>
              <a
                href="https://x.com/ryoshin0830"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600"
              >
                <Twitter size={24} className="text-blue-500" />
              </a>
              <a
                href="https://zenn.dev/ryoushin"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:border-sky-300 dark:hover:border-sky-600"
              >
                {/* Zenn logo */}
                <Image src="/logo-only.svg" alt="Zenn" width={24} height={24} className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="flex flex-col items-center gap-4 mt-2 mb-12">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t("discover")}
            </span>
            <button
              onClick={scrollToNext}
              className="p-3 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <ArrowDown size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
