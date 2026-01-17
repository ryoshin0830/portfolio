"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  Briefcase,
  Users,
  Sparkles,
  University,
} from "lucide-react";
import dynamic from "next/dynamic";

const TimelineSection = dynamic(() => import("./TimelineSection"), {
  ssr: false,
});

const AboutSection = () => {
  const t = useTranslations("about");
  const badgesT = useTranslations("badges");
  const skillsT = useTranslations("skills");
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const fields = t.raw("fields") as string[];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section id="about" className="pt-32 pb-24 bg-white dark:bg-slate-950 overflow-hidden" ref={ref}>
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
            <Sparkles size={14} className="sm:w-4 sm:h-4" />
            {badgesT("aboutMe")}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-slate-900 dark:text-white px-4">
            {t("title")}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto px-4">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="max-w-6xl mx-auto">
          {/* Current Status Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16"
          >
            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 shadow-sm"
            >
              <div className="relative">
                <div className="inline-flex p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-3 sm:mb-4">
                  <University className="text-slate-700 dark:text-slate-200" size={20} />
                </div>
                <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white mb-2">
                  {t("education")}
                </h3>
                <p className="text-slate-700 dark:text-slate-200 font-medium mb-1 text-sm sm:text-base">
                  {t("kyotoUniversity")}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {skillsT("jobTitle")}
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 shadow-sm"
            >
              <div className="relative">
                <div className="inline-flex p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-3 sm:mb-4">
                  <Briefcase className="text-slate-700 dark:text-slate-200" size={20} />
                </div>
                <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white mb-2">
                  {t("experience")}
                </h3>
                <p className="text-slate-700 dark:text-slate-200 font-medium mb-1 text-sm sm:text-base">
                  {t("eastLinker")}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {t("eastLinkerDescription")}
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 shadow-sm"
            >
              <div className="relative">
                <div className="inline-flex p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-3 sm:mb-4">
                  <Users className="text-slate-700 dark:text-slate-200" size={20} />
                </div>
                <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white mb-2">
                  {t("teaching")}
                </h3>
                <p className="text-slate-700 dark:text-slate-200 font-medium mb-1 text-sm sm:text-base">
                  {t("japaneseTeacher")}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {skillsT("yearsExperience", { years: "7" })}
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Specialization Fields */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
            className="mb-12 sm:mb-16"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6 sm:mb-8 text-center px-4">
              {t("specialization")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {fields.map((field, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 shadow-sm"
                >
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                  <p className="text-slate-700 dark:text-slate-300 font-medium text-sm sm:text-base">
                    {field}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>


          {/* Timeline Section */}
          <TimelineSection />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
