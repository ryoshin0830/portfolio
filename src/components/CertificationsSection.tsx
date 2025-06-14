"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Award, Car, Languages, FileText, Star } from "lucide-react";

interface Certification {
  title: string;
  description: string;
  date: string;
  icon: React.ElementType;
  featured?: boolean;
  score?: string;
}

export default function CertificationsSection() {
  const t = useTranslations("certifications");
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const certifications: Certification[] = [
    {
      title: t("jlptN1.title"),
      description: t("jlptN1.description"),
      date: t("jlptN1.date"),
      score: "180/180",
      icon: Star,
      featured: true,
    },
    {
      title: t("ict.title"),
      description: t("ict.description"),
      date: t("ict.date"),
      icon: FileText,
    },
    {
      title: t("japaneseDrivers.title"),
      description: t("japaneseDrivers.description"),
      date: t("japaneseDrivers.date"),
      icon: Car,
    },
    {
      title: t("chineseDrivers.title"),
      description: t("chineseDrivers.description"),
      date: t("chineseDrivers.date"),
      icon: Car,
    },
    {
      title: t("cet4.title"),
      description: t("cet4.description"),
      date: t("cet4.date"),
      icon: Languages,
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
    <section id="certifications" className="py-20" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {t("title")}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {certifications.map((cert, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`relative ${
                cert.featured
                  ? "md:col-span-2 lg:col-span-3"
                  : ""
              }`}
            >
              <div
                className={`${
                  cert.featured
                    ? "bg-gradient-to-r from-yellow-400 to-amber-500 p-1"
                    : "bg-gray-200 dark:bg-gray-700 p-px"
                } rounded-xl`}
              >
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 h-full">
                  {cert.featured && (
                    <div className="absolute -top-4 -right-4">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg"
                      >
                        {t("featured")}
                      </motion.div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        cert.featured
                          ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                          : "bg-gradient-to-r from-emerald-500 to-teal-500"
                      }`}
                    >
                      <cert.icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <h3
                        className={`font-bold mb-2 ${
                          cert.featured
                            ? "text-2xl"
                            : "text-xl"
                        } text-gray-900 dark:text-white`}
                      >
                        {cert.title}
                      </h3>
                      
                      {cert.score && (
                        <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text mb-2">
                          {cert.score}
                        </div>
                      )}
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {cert.description}
                      </p>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                        <Award className="w-4 h-4" />
                        <span>{cert.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t("continuousLearning")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}