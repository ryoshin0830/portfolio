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
      data-oid="xmnmyzh"
    >
      {/* Background Elements */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 -z-20"
        data-oid="wfpvt0r"
      />

      {/* Animated Background Shapes */}
      <div
        className="absolute inset-0 overflow-hidden -z-10"
        data-oid="qo1d--a"
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
          data-oid="1dv9-8d"
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
          data-oid="1m77max"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10" data-oid="9yxiqge">
        <div className="text-center max-w-4xl mx-auto" data-oid="9c80--g">
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
            data-oid="_7an28j"
          >
            <div className="relative w-48 h-48 mx-auto" data-oid="pke8ydp">
              <Image
                src="/logo.png"
                alt="梁震（りょう しん）"
                fill
                className="object-cover shadow-2xl ring-4 ring-white dark:ring-slate-700 w-[479px] h-[255px] rounded-[38px] -left-[11px] top-[53px]"
                priority
                data-oid="7u-h4j6"
              />

              <div
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 -z-10"
                data-oid="d9lxs._"
              />
            </div>
            <div
              className="w-[152px] h-[30px] bg-[#E3F3FF]"
              data-oid="t0kupzb"
            ></div>
          </motion.div>

          {/* Animated Role */}

          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            data-oid="x0d5tyr"
          >
            <AnimatePresence mode="wait" data-oid="pzjeo5n">
              <motion.h1
                key={currentNameIndex}
                className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-800 dark:text-white mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                data-oid="q3dksh2"
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
            data-oid="bfky4r7"
          >
            <div
              className="flex items-center justify-center mb-4"
              data-oid="kgy.yxk"
            >
              <div
                className="h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent flex-1 max-w-20"
                data-oid="lrd1v0d"
              />

              <AnimatePresence mode="wait" data-oid="l25gh2x">
                <motion.span
                  key={currentRoleIndex}
                  className="px-6 text-xl md:text-2xl font-semibold text-blue-600 dark:text-blue-400"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4 }}
                  data-oid="wb8tm4p"
                >
                  {roles[currentRoleIndex]}
                </motion.span>
              </AnimatePresence>
              <div
                className="h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent flex-1 max-w-20"
                data-oid="s5jjp:d"
              />
            </div>
          </motion.div>

          {/* Subtitle */}
          <motion.h2
            className="text-xl md:text-2xl lg:text-3xl text-slate-600 dark:text-slate-300 mb-4 font-light"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            data-oid="u1h-z1s"
          >
            {t("subtitle")}
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.8 }}
            data-oid="moy2wh2"
          >
            {t("description")}
          </motion.p>

          {/* Contact Info */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            data-oid="mkz_c-6"
          >
            {/* Email */}
            <motion.a
              href={`mailto:ryo.shin.j85@kyoto-u.jp`}
              className="flex items-center space-x-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-oid="24c_7l0"
            >
              <Mail size={20} data-oid=":li7hdr" />
              <span className="font-medium" data-oid="oaytl0i">
                <span
                  dangerouslySetInnerHTML={{ __html: obfuscatedEmail() }}
                  data-oid="5l501y0"
                />
              </span>
            </motion.a>

            {/* Social Links */}
            <div className="flex items-center space-x-4" data-oid="wuqm3h2">
              <motion.a
                href="https://github.com/ryoshin0830"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                data-oid="dif150q"
              >
                <Github size={20} data-oid=".9qjzn4" />
              </motion.a>
              <motion.a
                href="https://x.com/ryoshin0830"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                data-oid=":p3_3bb"
              >
                <Twitter size={20} data-oid="7wd9d-9" />
              </motion.a>
              <motion.a
                href="https://matsunoha.eastlinker.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                data-oid="9r-zk7s"
              >
                <ExternalLink size={20} data-oid="tt79tg:" />
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
            data-oid="oe6gn4j"
          >
            <span className="text-sm font-medium" data-oid="fcgnwxc">
              Scroll to explore
            </span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              data-oid="v56j8zo"
            >
              <ArrowDown size={20} data-oid="iauq-01" />
            </motion.div>
          </motion.button>
        </div>
      </div>
    </section>
  );
};
export default HeroSection;
