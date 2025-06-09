"use client";

import { useTranslations } from "next-intl";
import { Brain, FileText, Users, Lightbulb, BookOpen, Microscope } from "lucide-react";

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
    <section id="research" className="pt-32 pb-24 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50 dark:from-slate-900/80 dark:via-slate-950 dark:to-slate-900/50">
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
        <div>
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
                    <div
                      key={index}
                      className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all duration-200"
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
                    </div>
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
                    <div
                      key={index}
                      className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all duration-200"
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
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResearchSection;
