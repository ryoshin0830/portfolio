"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Brain, Users, Lightbulb, Microscope, ExternalLink } from "lucide-react";

const ResearchSection = () => {
  const t = useTranslations("research");
  const pubT = useTranslations("publications");
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const projects = [
    {
      icon: Brain,
      titleKey: "vocabularyDifficulty.title",
      descriptionKey: "vocabularyDifficulty.description",
      color: "blue",
      technologies: ["Python", "TensorFlow", "Natural Language Processing"],
    },
    {
      icon: Lightbulb,
      titleKey: "originalLLM.title",
      descriptionKey: "originalLLM.description",
      color: "purple",
      technologies: ["PyTorch", "Transformers", "Custom Architecture"],
    },
    {
      icon: Users,
      titleKey: "teamDevelopment.title",
      descriptionKey: "teamDevelopment.description",
      color: "green",
      technologies: ["Agile/Scrum", "CI/CD", "Microservices", "DevOps", "Product Management", "Technical Architecture"],
    },
  ];

  // Publications data
  const publications = [
    {
      authors: "中野 珠悠・梁 震・笹尾 洋介",
      year: 2024,
      title: "英語検定教科書コーパスに基づく高頻度コロケーションの分析",
      journal: "全国英語教育学会 JASELE 第49回福岡研究大会",
      type: "conference",
    },
    {
      authors: "梁 震・笹尾 洋介",
      year: 2024,
      title: "汎用言語モデルは日本語学習者データに基づく語彙難易度を予測できるのか",
      journal: "言語処理学会2024",
      type: "conference",
    },
    {
      authors: "彭 悦, 梁 震, 笹尾 洋介",
      year: 2023,
      title: "日中バイリンガルの音声版日本語語彙サイズテストの開発と検証",
      journal: "日本語教育",
      volume: "185",
      pages: "93–108",
      link: "https://www.nkg.or.jp/gakkaishi/yomu/2023_08_25.html",
      type: "journal",
    },
    {
      authors: "Vincent, N. H., Liang, Z., & Sasao, Y.",
      year: 2023,
      title: "Motion and memory in VR: The influence of VR control method on memorization of foreign language orthography",
      journal: "International Journal on Cybernetics & Informatics (IJCI)",
      volume: "12(1)",
      pages: "151–164",
      link: "https://ijcionline.com/paper/12/12123ijci12.pdf",
      type: "journal",
    },
    {
      authors: "彭 悦, 梁 震, 笹尾 洋介",
      year: 2022,
      title: "日本語学習における映像作品の字幕利用ー言語選択の視点からー",
      journal: "言語文化教育研究",
      volume: "20",
      pages: "335–356",
      doi: "https://doi.org/10.14960/gbkkg.20.335",
      type: "journal",
    },
    {
      authors: "彭 悦・梁 震・笹尾 洋介",
      year: 2022,
      title: "日中バイリンガルの音声版日本語語彙サイズテストの開発と検証",
      journal: "日本語教育学会秋季大会予稿集",
      type: "conference",
    },
    {
      authors: "梁 震・笹尾 洋介",
      year: 2022,
      title: "日本語語彙問題の選択肢自動生成プログラムの開発と検証",
      journal: "日本語教育学会春季大会予稿集",
      type: "conference",
    },
  ];


  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-800",
          icon: "text-blue-600 dark:text-blue-400",
          accent: "bg-blue-600",
        };
      case "purple":
        return {
          bg: "bg-purple-50 dark:bg-purple-900/20",
          border: "border-purple-200 dark:border-purple-800",
          icon: "text-purple-600 dark:text-purple-400",
          accent: "bg-purple-600",
        };
      case "green":
        return {
          bg: "bg-green-50 dark:bg-green-900/20",
          border: "border-green-200 dark:border-green-800",
          icon: "text-green-600 dark:text-green-400",
          accent: "bg-green-600",
        };
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-900/20",
          border: "border-gray-200 dark:border-gray-800",
          icon: "text-gray-600 dark:text-gray-400",
          accent: "bg-gray-600",
        };
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
    <section id="research" className="pt-32 pb-24 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50 dark:from-slate-900/80 dark:via-slate-950 dark:to-slate-900/50" ref={ref}>
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium mb-6">
            <Microscope size={16} />
            Academic Research
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black gradient-text mb-6 tracking-tight">
            {t("title")}
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Research Projects */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-12 text-center">
            {t("projects")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => {
              const colors = getColorClasses(project.color);
              const IconComponent = project.icon;

              return (
                <div
                  key={index}
                  className="group relative overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-200"
                >
                  <div className="flex items-center mb-4">
                    <div
                      className={`p-3 rounded-lg ${colors.accent} text-white mr-4`}
                    >
                      <IconComponent size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-800 dark:text-white">
                      {t(project.titleKey)}
                    </h4>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    {t(project.descriptionKey)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="px-3 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-full border border-slate-200 dark:border-slate-600"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Publications */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-20"
        >
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-12 text-center">
            {t("publications")}
          </h3>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="space-y-6 max-w-4xl mx-auto"
          >
            {publications.map((pub, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                    {pub.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                      pub.type === "journal" 
                        ? "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30"
                        : "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30"
                    }`}>
                      {pub.year}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      {pub.type === "journal" ? t("peerReviewedPapers") : t("conferencePresentations")}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {pub.authors}
                </p>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic">
                  {pub.journal}
                  {pub.volume && `, ${pub.volume}`}
                  {pub.pages && `, pp. ${pub.pages}`}
                </p>
                
                {(pub.doi || pub.link) && (
                  <div className="mt-3">
                    {pub.doi && (
                      <a
                        href={pub.doi}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline mr-4"
                      >
                        DOI →
                      </a>
                    )}
                    {pub.link && (
                      <a
                        href={pub.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        {pubT("viewPaper")} <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
};

export default ResearchSection;
