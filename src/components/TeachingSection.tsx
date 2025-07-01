"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { GraduationCap, Users, Clock, Award, BookOpen, Target, Calendar } from "lucide-react";

export default function TeachingSection() {
  const t = useTranslations("teaching");
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const stats = [
    {
      icon: GraduationCap,
      value: "7",
      label: t("yearsExperience"),
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Clock,
      value: "5,000+",
      label: t("teachingHours"),
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Users,
      value: "300+",
      label: t("studentsTotal"),
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Target,
      value: "95%",
      label: t("passRate"),
      color: "from-orange-500 to-red-500",
    },
  ];

  const courses = [
    {
      title: t("courses.basic.title"),
      description: t("courses.basic.description"),
      icon: BookOpen,
      features: t.raw("courses.basic.features") as string[],
    },
    {
      title: t("courses.jlpt.title"),
      description: t("courses.jlpt.description"),
      icon: Award,
      features: t.raw("courses.jlpt.features") as string[],
    },
    {
      title: t("courses.business.title"),
      description: t("courses.business.description"),
      icon: Users,
      features: t.raw("courses.business.features") as string[],
    },
  ];

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
    <section id="teaching" className="py-20" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {t("title")}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* JLPT Perfect Score Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-md mx-auto mb-12"
        >
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-1 rounded-2xl shadow-lg">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center">
              <Award className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                JLPT N1 {t("perfectScore")}
              </h3>
              <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text">
                180/180
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {t("perfectScoreDescription")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className={`bg-gradient-to-r ${stat.color} p-3 rounded-lg w-fit mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Teaching Experience */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            {t("experienceTitle")}
          </h3>
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8">
            <h4 className="text-xl font-semibold mb-4 text-indigo-600 dark:text-indigo-400">
              {t("newOriental")}
            </h4>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t("experienceDescription")}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {t("achievements")}
                </h5>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• {t("achievement1")}</li>
                  <li>• {t("achievement2")}</li>
                  <li>• {t("achievement3")}</li>
                </ul>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {t("specialties")}
                </h5>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• {t("specialty1")}</li>
                  <li>• {t("specialty2")}</li>
                  <li>• {t("specialty3")}</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Courses */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            {t("coursesOffered")}
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-lg w-fit mb-4">
                  <course.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  {course.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {course.description}
                </p>
                <ul className="space-y-2">
                  {course.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start text-sm text-gray-600 dark:text-gray-400"
                    >
                      <span className="text-indigo-500 mr-2">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Teaching Philosophy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 text-center max-w-3xl mx-auto"
        >
          <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            {t("philosophyTitle")}
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 italic">
            &ldquo;{t("philosophyQuote")}&rdquo;
          </p>
        </motion.div>

        {/* Schedule Lessons Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <a
            href="/schedule-lesson?from=site"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Calendar className="w-6 h-6" />
            {t("scheduleLesson")}
          </a>
        </motion.div>

      </div>
    </section>
  );
}