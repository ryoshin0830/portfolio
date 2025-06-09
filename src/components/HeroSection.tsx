"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { ArrowDown, Github, Twitter, Mail, ExternalLink } from "lucide-react";
import Image from "next/image";

const HeroSection = () => {
  const [currentNameIndex, setCurrentNameIndex] = useState(0);
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const t = useTranslations("hero");
  const locale = useLocale();

  const names = ["梁 震（りょう しん）", "RYO SHIN", "LIANG ZHEN"];

  const roles = t.raw("roles") as string[];

  useEffect(() => {
    const nameInterval = setInterval(() => {
      setCurrentNameIndex((prev) => (prev + 1) % names.length);
    }, 3000);

    return () => clearInterval(nameInterval);
  }, [names.length]);

  useEffect(() => {
    const roleInterval = setInterval(() => {
      setCurrentRoleIndex((prev) => (prev + 1) % roles.length);
    }, 2500);

    return () => clearInterval(roleInterval);
  }, [roles.length]);

  const scrollToNext = () => {
    const aboutSection = document.querySelector("#about");
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const obfuscatedEmail = () => {
    const user = "ryo.shin.j85";
    const domain = "kyoto-u.jp";
    return `${user}&#64;${domain}`;
  };

  return (
    <section
      id="hero"
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      data-oid="dsps8dm"
    >
      {/* Background Elements */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 -z-20"
        data-oid="9x3_j.v"
      />

      {/* Animated Background Shapes */}
      <div
        className="absolute inset-0 overflow-hidden -z-10"
        data-oid="xylsw9t"
      >
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          data-oid="5k5jepd"
        />

        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          data-oid="6nsdhj:"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10" data-oid="yj4me.y">
        <div className="text-center max-w-4xl mx-auto" data-oid=":oqpkch">
          {/* Profile Image */}

          {/* Animated Name */}

          <motion.div
            className="mb-8 h-[296px]"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2,
            }}
            data-oid="i:w9ut0"
            key="olk-kfed"
          >
            <div
              className="relative w-48 h-48 mx-auto"
              data-oid="vsllvh."
              key="olk-_-kk"
            >
              <Image
                src="/logo.png"
                alt="梁震（りょう しん）"
                fill
                className="object-cover shadow-2xl ring-4 ring-white dark:ring-slate-700 w-[479px] h-[255px] rounded-[38px] -left-[11px] top-[53px]"
                priority
                data-oid="g-.kli-"
              />

              <div
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 -z-10"
                data-oid="f_i7e1b"
              />
            </div>
            <div
              className="w-[152px] h-[30px] bg-[#E3F3FF]"
              data-oid="2fg6meh"
              key="olk-eCN0"
            ></div>
          </motion.div>

          {/* Animated Role */}

          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            data-oid="q:_g2-f"
            key="olk-Y4z5"
          >
            <AnimatePresence mode="wait" data-oid="iqr:hbg">
              <motion.h1
                key={currentNameIndex}
                className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-800 dark:text-white mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                data-oid="79fv0-j"
              >
                {names[currentNameIndex]}
              </motion.h1>
            </AnimatePresence>
          </motion.div>
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            data-oid="7f1o590"
          >
            <div
              className="flex items-center justify-center mb-4"
              data-oid="zjpknda"
            >
              <div
                className="h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent flex-1 max-w-20"
                data-oid="6lbroz1"
              />

              <AnimatePresence mode="wait" data-oid="jkokqw3">
                <motion.span
                  key={currentRoleIndex}
                  className="px-6 text-xl md:text-2xl font-semibold text-blue-600 dark:text-blue-400"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4 }}
                  data-oid="iwwx.r4"
                >
                  {roles[currentRoleIndex]}
                </motion.span>
              </AnimatePresence>
              <div
                className="h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent flex-1 max-w-20"
                data-oid="icy-:4."
              />
            </div>
          </motion.div>

          {/* Subtitle */}
          <motion.h2
            className="text-xl md:text-2xl lg:text-3xl text-slate-600 dark:text-slate-300 mb-4 font-light"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            data-oid="b2:ymwu"
          >
            {t("subtitle")}
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.8 }}
            data-oid=":aw.0qn"
          >
            {t("description")}
          </motion.p>

          {/* Contact Info */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            data-oid="31g8jov"
          >
            {/* Email */}
            <motion.a
              href={`mailto:ryo.shin.j85@kyoto-u.jp`}
              className="flex items-center space-x-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-oid="csza0is"
            >
              <Mail size={20} data-oid=".vcgj32" />
              <span className="font-medium" data-oid="u3r3utt">
                <span
                  dangerouslySetInnerHTML={{ __html: obfuscatedEmail() }}
                  data-oid=".mjy0iq"
                />
              </span>
            </motion.a>

            {/* Social Links */}
            <div className="flex items-center space-x-4" data-oid="mcktib5">
              <motion.a
                href="https://github.com/ryoshin0830"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                data-oid="2fw10f1"
              >
                <Github size={20} data-oid="2p5ejyo" />
              </motion.a>
              <motion.a
                href="https://x.com/ryoshin0830"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                data-oid="32_6hu0"
              >
                <Twitter size={20} data-oid="qscmo96" />
              </motion.a>
              <motion.a
                href="https://matsunoha.eastlinker.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                data-oid="x85n6hn"
              >
                <ExternalLink size={20} data-oid="tglf:ke" />
              </motion.a>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.button
            onClick={scrollToNext}
            className="inline-flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            whileHover={{ y: 5 }}
            data-oid=".5mpwpl"
          >
            <span className="text-sm font-medium" data-oid="pa_s45j">
              Scroll to explore
            </span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              data-oid="72hpbnp"
            >
              <ArrowDown size={20} data-oid="3jy5.p3" />
            </motion.div>
          </motion.button>
        </div>
      </div>
    </section>
  );
};
export default HeroSection;
