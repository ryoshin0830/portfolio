"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Brain, FileText, Users, Lightbulb, BookOpen } from "lucide-react";

const ResearchSection = () => {
  const t = useTranslations("research");

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
      technologies: ["Swift", "Git", "Docker", "Team Leadership"],
    },
  ];

  // Get publications from translations
  const peerReviewedPapers = t.raw("peerReviewedList") as Array<{
    authors: string;
    year: string;
    title: string;
    journal: string;
    volume: string;
    pages: string;
  }>;

  const conferencePresentations = t.raw(
    "conferencePresentationsList",
  ) as Array<{
    authors: string;
    year: string;
    title: string;
    conference: string;
  }>;

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

  return (
    <section id="research" className="py-20 bg-slate-50 dark:bg-slate-800">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-4">
            {t("title")}
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Research Projects */}
        <motion.div
          className="mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-12 text-center">
            {t("projects")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => {
              const colors = getColorClasses(project.color);
              const IconComponent = project.icon;

              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className={`p-6 rounded-xl border ${colors.bg} ${colors.border} hover:shadow-lg transition-all duration-300 group`}
                  whileHover={{ scale: 1.02 }}
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
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Publications */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-12 text-center">
            {t("publications")}
          </h3>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Peer-Reviewed Papers */}
              <div>
                <h4 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 flex items-center">
                  <FileText className="mr-2 text-blue-600" size={20} />

                  {t("peerReviewedPapers")}
                </h4>
                <div className="space-y-4">
                  {peerReviewedPapers.map((paper, index) => (
                    <motion.div
                      key={index}
                      className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all duration-300"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                          {paper.year}
                        </span>
                      </div>
                      <h5 className="font-medium text-slate-800 dark:text-white mb-2 leading-snug">
                        {paper.title}
                      </h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        {paper.authors}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">
                        {paper.journal}
                        {paper.volume && `, ${paper.volume}`}
                        {paper.pages && `, ${paper.pages}`}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Conference Presentations */}
              <div>
                <h4 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 flex items-center">
                  <BookOpen className="mr-2 text-green-600" size={20} />

                  {t("conferencePresentations")}
                </h4>
                <div className="space-y-4">
                  {conferencePresentations.map((paper, index) => (
                    <motion.div
                      key={index}
                      className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all duration-300"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                          {paper.year}
                        </span>
                      </div>
                      <h5 className="font-medium text-slate-800 dark:text-white mb-2 leading-snug">
                        {paper.title}
                      </h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        {paper.authors}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">
                        {paper.conference}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ResearchSection;
