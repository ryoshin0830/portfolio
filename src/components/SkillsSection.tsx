"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Code,
  Monitor,
  Server,
  Database,
  Cloud,
  Brain,
  Globe,
} from "lucide-react";
import {
  SiJavascript,
  SiTypescript,
  SiPython,
  SiSwift,
  SiReact,
  SiNextdotjs,
  SiNodedotjs,
  SiDjango,
  SiMongodb,
  SiMariadb,
  SiReact as SiReactnative,
  SiAwsamplify as SiAws,
  SiGooglecloud,
  SiVercel,
  SiPytorch,
  SiTensorflow,
} from "react-icons/si";

const SkillsSection = () => {
  const t = useTranslations("skills");

  const skillCategories = [
    {
      titleKey: "programming",
      icon: Code,
      color: "blue",
      skills: [
        { name: "JavaScript", icon: SiJavascript, level: 95, color: "#F7DF1E" },
        { name: "TypeScript", icon: SiTypescript, level: 90, color: "#3178C6" },
        { name: "Python", icon: SiPython, level: 85, color: "#3776AB" },
        { name: "Swift", icon: SiSwift, level: 80, color: "#FA7343" },
      ],
    },
    {
      titleKey: "frontend",
      icon: Monitor,
      color: "purple",
      skills: [
        { name: "React", icon: SiReact, level: 95, color: "#61DAFB" },
        { name: "Next.js", icon: SiNextdotjs, level: 90, color: "#000000" },
        {
          name: "React Native",
          icon: SiReactnative,
          level: 85,
          color: "#61DAFB",
        },
      ],
    },
    {
      titleKey: "backend",
      icon: Server,
      color: "green",
      skills: [
        { name: "Node.js", icon: SiNodedotjs, level: 90, color: "#339933" },
        { name: "Django", icon: SiDjango, level: 85, color: "#092E20" },
      ],
    },
    {
      titleKey: "database",
      icon: Database,
      color: "orange",
      skills: [
        { name: "MongoDB", icon: SiMongodb, level: 90, color: "#47A248" },
        { name: "MariaDB", icon: SiMariadb, level: 85, color: "#003545" },
      ],
    },
    {
      titleKey: "cloud",
      icon: Cloud,
      color: "indigo",
      skills: [
        { name: "AWS", icon: SiAws, level: 85, color: "#232F3E" },
        {
          name: "Google Cloud",
          icon: SiGooglecloud,
          level: 80,
          color: "#4285F4",
        },
        { name: "Vercel", icon: SiVercel, level: 90, color: "#000000" },
      ],
    },
    {
      titleKey: "ai",
      icon: Brain,
      color: "pink",
      skills: [
        { name: "PyTorch", icon: SiPytorch, level: 85, color: "#EE4C2C" },
        { name: "TensorFlow", icon: SiTensorflow, level: 80, color: "#FF6F00" },
      ],
    },
  ];

  const languages = [
    {
      name: "日本語",
      level: 100,
      description: "JLPT N1 満点・ネイティブレベル",
      flag: "🇯🇵",
    },
    {
      name: "中国語",
      level: 100,
      description: "母国語（北京出身）",
      flag: "🇨🇳",
    },
    {
      name: "英語",
      level: 75,
      description: "CET Level 4・研究論文執筆レベル",
      flag: "🇺🇸",
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
      transition: { duration: 0.6 },
    },
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-500";
      case "purple":
        return "bg-purple-500";
      case "green":
        return "bg-green-500";
      case "orange":
        return "bg-orange-500";
      case "indigo":
        return "bg-indigo-500";
      case "pink":
        return "bg-pink-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <section
      id="skills"
      className="py-20 bg-white dark:bg-slate-900"
      data-oid="aoxt_ot"
    >
      <div className="container mx-auto px-4" data-oid="_q5dxda">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          data-oid="d_s.1tf"
        >
          <h2
            className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-4"
            data-oid="c5k39l9"
          >
            {t("title")}
          </h2>
          <p
            className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
            data-oid="80hqs2v"
          >
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Technical Skills */}
        <motion.div
          className="mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          data-oid="tounxc-"
        >
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            data-oid="wuaj::5"
          >
            {skillCategories.map((category, categoryIndex) => {
              const IconComponent = category.icon;

              return (
                <motion.div
                  key={categoryIndex}
                  variants={itemVariants}
                  className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300"
                  data-oid=".rzi3a9"
                >
                  <div className="flex items-center mb-6" data-oid="ywtfyw2">
                    <div
                      className={`p-3 rounded-lg ${getColorClasses(category.color)} text-white mr-4`}
                      data-oid="idqejgj"
                    >
                      <IconComponent size={24} data-oid="7tid55u" />
                    </div>
                    <h3
                      className="text-xl font-bold text-slate-800 dark:text-white"
                      data-oid="r4zb22."
                    >
                      {t(category.titleKey)}
                    </h3>
                  </div>

                  <div className="space-y-4" data-oid="c_n68m:">
                    {category.skills.map((skill, skillIndex) => {
                      const SkillIcon = skill.icon;

                      return (
                        <div
                          key={skillIndex}
                          className="space-y-2"
                          data-oid="n67g3b6"
                        >
                          <div
                            className="flex items-center justify-between"
                            data-oid="y:2i_f1"
                          >
                            <div
                              className="flex items-center space-x-3"
                              data-oid="wjgu520"
                            >
                              <SkillIcon
                                size={20}
                                style={{ color: skill.color }}
                                data-oid="d0iogso"
                              />

                              <span
                                className="text-slate-700 dark:text-slate-300 font-medium"
                                data-oid="m9k5xza"
                              >
                                {skill.name}
                              </span>
                            </div>
                            <span
                              className="text-sm text-slate-500 dark:text-slate-400"
                              data-oid="r9:h-59"
                            >
                              {skill.level}%
                            </span>
                          </div>
                          <div
                            className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"
                            data-oid="-4kg:ni"
                          >
                            <motion.div
                              className="h-2 rounded-full"
                              style={{ backgroundColor: skill.color }}
                              initial={{ width: 0 }}
                              whileInView={{ width: `${skill.level}%` }}
                              transition={{
                                duration: 1,
                                delay: skillIndex * 0.1,
                              }}
                              viewport={{ once: true }}
                              data-oid="5bmjl9n"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Language Skills */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          data-oid="nz2w::0"
        >
          <h3
            className="text-3xl font-bold text-slate-800 dark:text-white mb-12 text-center flex items-center justify-center"
            data-oid="-btv55_"
          >
            <Globe
              className="mr-3 text-blue-600"
              size={32}
              data-oid="700xjv9"
            />

            {t("languages")}
          </h3>

          <div className="max-w-4xl mx-auto" data-oid="i0p4qwi">
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              data-oid="pmtz:4y"
            >
              {languages.map((language, index) => (
                <motion.div
                  key={index}
                  className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-slate-200 dark:border-slate-600"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                  data-oid="mgi_3f_"
                >
                  <div className="text-4xl mb-4" data-oid="enhp9-j">
                    {language.flag}
                  </div>
                  <h4
                    className="text-xl font-bold text-slate-800 dark:text-white mb-2"
                    data-oid="u1ql5gr"
                  >
                    {language.name}
                  </h4>
                  <p
                    className="text-sm text-slate-600 dark:text-slate-400 mb-4"
                    data-oid="c5wv.s:"
                  >
                    {language.description}
                  </p>

                  <div className="space-y-2" data-oid="22mfe1t">
                    <div
                      className="flex justify-between items-center"
                      data-oid="0z50unn"
                    >
                      <span
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        data-oid="tmrw1.d"
                      >
                        習熟度
                      </span>
                      <span
                        className="text-sm text-slate-500 dark:text-slate-400"
                        data-oid="ncc_d29"
                      >
                        {language.level}%
                      </span>
                    </div>
                    <div
                      className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2"
                      data-oid="6rrhd02"
                    >
                      <motion.div
                        className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${language.level}%` }}
                        transition={{ duration: 1, delay: index * 0.2 }}
                        viewport={{ once: true }}
                        data-oid="8894of8"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SkillsSection;
