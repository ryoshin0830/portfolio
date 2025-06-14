"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  Briefcase,
  Users,
  Calendar,
  Baby,
  Plane,
  Home,
  GraduationCap,
  School,
  University,
  Rocket,
  Sparkles,
} from "lucide-react";

const AboutSection = () => {
  const t = useTranslations("about");
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const fields = t.raw("fields") as string[];
  const timelineEvents = t.raw("timelineEvents") as Array<{
    year: string;
    title: string;
    description: string;
    icon?: string;
  }>;

  const getTimelineIcon = (icon?: string) => {
    switch (icon) {
      case "birth": return Baby;
      case "plane": return Plane;
      case "home": return Home;
      case "school": return School;
      case "university": return University;
      case "graduation": return GraduationCap;
      case "rocket": return Rocket;
      default: return Calendar;
    }
  };

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
    <section id="about" className="pt-32 pb-24 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-950 dark:to-slate-900/50" ref={ref}>
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-full text-sm font-medium mb-6">
            <Sparkles size={16} />
            About Me
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-900 dark:text-white">
            {t("title")}
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
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
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          >
            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden bg-white dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="inline-flex p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg mb-4">
                  <University className="text-white" size={24} />
                </div>
                <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2">
                  {t("education")}
                </h3>
                <p className="text-slate-700 dark:text-slate-200 font-medium mb-1">
                  {t("kyotoUniversity")}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  PhD Student • Research
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden bg-white dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="inline-flex p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg mb-4">
                  <Briefcase className="text-white" size={24} />
                </div>
                <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2">
                  {t("experience")}
                </h3>
                <p className="text-slate-700 dark:text-slate-200 font-medium mb-1">
                  {t("eastLinker")}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("eastLinkerDescription")}
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden bg-white dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="inline-flex p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg mb-4">
                  <Users className="text-white" size={24} />
                </div>
                <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2">
                  {t("teaching")}
                </h3>
                <p className="text-slate-700 dark:text-slate-200 font-medium mb-1">
                  {t("japaneseTeacher")}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  7+ Years Experience
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Specialization Fields */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">
              {t("specialization")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {field}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Minimalist Stats */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
          >
            {[
              { value: "7+", label: "年間の教育経験", color: "from-blue-500 to-cyan-500" },
              { value: "5000+", label: "指導時間", color: "from-purple-500 to-pink-500" },
              { value: "300+", label: "指導学生数", color: "from-emerald-500 to-teal-500" },
              { value: "95%", label: "JLPT合格率", color: "from-orange-500 to-red-500" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center"
              >
                <div className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                  {stat.value}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Modern Timeline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-12 text-center">
              {t("timeline")}
            </h3>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 md:left-1/2 transform md:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-300 via-slate-300 to-transparent dark:from-slate-700 dark:via-slate-700" />

              {timelineEvents.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`relative flex items-center mb-12 ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-900 rounded-full border-2 border-slate-400 dark:border-slate-600 z-10" />

                  {/* Content */}
                  <div className={`flex-1 ml-20 md:ml-0 ${index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                    <div className="inline-block">
                      <div className={`flex items-center gap-3 mb-2 ${index % 2 === 0 ? "md:flex-row-reverse" : ""}`}>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          {event.year}
                        </span>
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          {(() => {
                            const Icon = getTimelineIcon(event.icon);
                            return <Icon className="text-slate-600 dark:text-slate-400" size={16} />;
                          })()}
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        {event.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {event.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;