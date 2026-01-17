"use client";

import { useTranslations } from "next-intl";
import {
  Code,
  Monitor,
  Server,
  Database,
  Cloud,
  Brain,
  Globe,
  Zap,
  TrendingUp,
  Award,
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
      name: t("languageProficiency.japanese"),
      level: 100,
      description: t("languageProficiency.japaneseLevel"),
      flag: "🇯🇵",
    },
    {
      name: t("languageProficiency.chinese"),
      level: 100,
      description: t("languageProficiency.chineseLevel"),
      flag: "🇨🇳",
    },
    {
      name: t("languageProficiency.english"),
      level: 75,
      description: t("languageProficiency.englishLevel"),
      flag: "🇺🇸",
    },
  ];

  // Get certifications from translations
  const certifications = t.raw("certifications") as {
    title: string;
    subtitle: string;
    list: Array<{
      name: string;
      description: string;
      date: string;
      featured: boolean;
    }>;
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
    <section id="skills" className="pt-32 pb-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-full text-sm font-medium mb-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <Zap size={16} />
            {t("technicalExpertise")}
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-slate-900 dark:text-white mb-6 tracking-tight">
            {t("title")}
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Technical Skills */}
        <div className="mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {skillCategories.map((category, categoryIndex) => {
              const IconComponent = category.icon;

              return (
                <div
                  key={categoryIndex}
                  className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="relative z-10">
                    <div className="flex items-center mb-8">
                      <div className={`p-4 rounded-2xl ${getColorClasses(category.color)} text-white mr-4 shadow-lg transition-transform duration-200`}>
                        <IconComponent size={28} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        {t(category.titleKey)}
                      </h3>
                    </div>

                    <div className="space-y-6">
                      {category.skills.map((skill, skillIndex) => {
                        const SkillIcon = skill.icon;

                        return (
                          <div 
                            key={skillIndex} 
                            className="space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                  <SkillIcon
                                    size={24}
                                    style={{ color: skill.color }}
                                  />
                                </div>
                                <span className="text-slate-700 dark:text-slate-300 font-semibold text-lg">
                                  {skill.name}
                                </span>
                              </div>
                              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
                                {skill.level}%
                              </span>
                            </div>
                            
                            <div className="relative w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                              <div
                                className="h-full rounded-full relative overflow-hidden transition-all duration-1000 ease-out"
                                style={{ 
                                  background: skill.color,
                                  width: `${skill.level}%`
                                }}
                              >
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Certifications */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm mb-8">
              <div className="p-2 bg-slate-900 dark:bg-white rounded-lg shadow-sm">
                <Award className="text-white dark:text-slate-900" size={20} />
              </div>
              <span className="font-bold text-slate-800 dark:text-white">{certifications.title}</span>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {certifications.subtitle}
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certifications.list.map((cert, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <Award className="text-slate-700 dark:text-slate-200" size={24} />
                      </div>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        {cert.date}
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                      {cert.name}
                    </h4>
                    
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {cert.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Language Skills */}
        <div>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm mb-8">
              <div className="p-2 bg-slate-900 dark:bg-white rounded-lg shadow-sm">
                <Globe className="text-white dark:text-slate-900" size={20} />
              </div>
              <span className="font-bold text-slate-800 dark:text-white">{t("languages")}</span>
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {languages.map((language, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="relative z-10 text-center">
                    <div className="text-6xl mb-6 filter drop-shadow-lg">
                      {language.flag}
                    </div>
                    
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                      {language.name}
                    </h4>
                    
                    <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                      {language.description}
                    </p>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <TrendingUp size={16} />
                          {t("proficiency")}
                        </span>
                        <span className="font-bold text-lg text-slate-800 dark:text-white px-3 py-1 bg-blue-50 dark:bg-blue-950/40 rounded-full">
                          {language.level}%
                        </span>
                      </div>
                      
                      <div className="relative w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full relative overflow-hidden transition-all duration-1000 ease-out"
                          style={{ width: `${language.level}%` }}
                        >
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
