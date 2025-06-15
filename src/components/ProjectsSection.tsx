"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, Smartphone, Globe, Brain, BookOpen, Rocket, Star } from "lucide-react";
import {
  SiReact as SiReactnative,
  SiSwift,
  SiNextdotjs,
  SiAwsamplify as SiAws,
  SiMongodb,
  SiPython,
  SiTensorflow,
  SiNodedotjs,
  SiVercel,
  SiGooglecloud,
  SiNginx,
  SiMariadb,
  SiPostgresql,
  SiTypescript,
  SiTailwindcss,
} from "react-icons/si";

const ProjectsSection = () => {
  const t = useTranslations("projects");
  const tBadges = useTranslations("badges");
  const tStatus = useTranslations("status");
  const tDates = useTranslations("dates");

  // Get projects from translations
  const projectsList = t.raw("projectsList") as Array<{
    title: string;
    description: string;
    technologies: string[];
    features: string[];
  }>;

  const getTechIcon = (techName: string) => {
    const lowerName = techName.toLowerCase();
    if (lowerName.includes("react")) return SiReactnative;
    if (lowerName.includes("swift")) return SiSwift;
    if (lowerName.includes("next")) return SiNextdotjs;
    if (lowerName.includes("aws")) return SiAws;
    if (lowerName.includes("mongo")) return SiMongodb;
    if (lowerName.includes("python")) return SiPython;
    if (lowerName.includes("tensor")) return SiTensorflow;
    if (lowerName.includes("node")) return SiNodedotjs;
    if (lowerName.includes("vercel")) return SiVercel;
    if (lowerName.includes("google") || lowerName.includes("gcp"))
      return SiGooglecloud;
    if (lowerName.includes("nginx")) return SiNginx;
    if (lowerName.includes("maria")) return SiMariadb;
    if (lowerName.includes("postgre")) return SiPostgresql;
    if (lowerName.includes("typescript")) return SiTypescript;
    if (lowerName.includes("tailwind")) return SiTailwindcss;
    return SiReactnative; // Default icon
  };

  const projects = projectsList.map((project, index) => {
    const icons = [Globe, Smartphone, Globe, BookOpen, Brain];
    const colors = ["purple", "blue", "green", "orange", "red"];
    const statuses = ["ongoing", "completed", "active", "completed", "ongoing"];
    const years = [
      tDates("yearToPresent", { year: "2025" }),
      tDates("yearRange", { start: "2022", end: "2023" }),
      tDates("yearRange", { start: "2023", end: "2024" }),
      tDates("yearRange", { start: "2021", end: "2022" }),
      tDates("yearToPresent", { year: "2023" })
    ];

    return {
      ...project,
      icon: icons[index] || Globe,
      color: colors[index] || "gray",
      status: statuses[index] || "ongoing",
      year: years[index] || "2024",
      technologies: project.technologies.map((tech) => ({
        name: tech,
        icon: getTechIcon(tech),
      })),
      links:
        index === 0 ? { live: "https://gorilla.eastlinker.com" } : 
        index === 2 ? { live: "https://matsunoha.eastlinker.com" } : undefined,
    };
  });


  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-800",
          accent: "bg-blue-600",
          text: "text-blue-600 dark:text-blue-400",
        };
      case "green":
        return {
          bg: "bg-green-50 dark:bg-green-900/20",
          border: "border-green-200 dark:border-green-800",
          accent: "bg-green-600",
          text: "text-green-600 dark:text-green-400",
        };
      case "purple":
        return {
          bg: "bg-purple-50 dark:bg-purple-900/20",
          border: "border-purple-200 dark:border-purple-800",
          accent: "bg-purple-600",
          text: "text-purple-600 dark:text-purple-400",
        };
      case "red":
        return {
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-800",
          accent: "bg-red-600",
          text: "text-red-600 dark:text-red-400",
        };
      case "orange":
        return {
          bg: "bg-orange-50 dark:bg-orange-900/20",
          border: "border-orange-200 dark:border-orange-800",
          accent: "bg-orange-600",
          text: "text-orange-600 dark:text-orange-400",
        };
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-900/20",
          border: "border-gray-200 dark:border-gray-800",
          accent: "bg-gray-600",
          text: "text-gray-600 dark:text-gray-400",
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return {
          label: tStatus("completed"),
          color:
            "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
        };
      case "active":
        return {
          label: tStatus("active"),
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
        };
      case "ongoing":
        return {
          label: tStatus("ongoing"),
          color:
            "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
        };
      default:
        return {
          label: tStatus("undefined"),
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
        };
    }
  };

  return (
    <section id="projects" className="pt-32 pb-24 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50 dark:from-slate-900/80 dark:via-slate-950 dark:to-slate-900/50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium mb-6">
            <Rocket size={16} />
            {tBadges("featuredProjects")}
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black gradient-text mb-6 tracking-tight">
            {t("title")}
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {projects.map((project, index) => {
            const colors = getColorClasses(project.color);
            const IconComponent = project.icon;
            const statusBadge = getStatusBadge(project.status);

            return (
              <div
                key={index}
                className="group relative overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-200"
              >
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-4 rounded-2xl ${colors.accent} text-white shadow-lg transition-transform duration-200`}>
                        <IconComponent size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusBadge.color} shadow-md transition-transform duration-200`}>
                            {statusBadge.label}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                            <Star size={14} />
                            {project.year}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Links */}
                    {project.links && (
                      <div className="flex gap-2">
                        {project.links.live && (
                          <a
                            href={project.links.live}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-blue-600 dark:text-blue-400"
                          >
                            <ExternalLink size={20} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed text-lg">
                    {project.description}
                  </p>

                  {/* Features */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      {t("mainFeatures")}
                    </h4>
                    <ul className="space-y-3">
                      {project.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="text-slate-600 dark:text-slate-400 flex items-start gap-3"
                        >
                          <div className={`w-3 h-3 ${colors.accent} rounded-full mt-1.5 flex-shrink-0 shadow-md`} />
                          <span className="font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Technologies */}
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      {t("techStack")}
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {project.technologies.map((tech, techIndex) => {
                        const TechIcon = tech.icon;
                        return (
                          <div
                            key={techIndex}
                            className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <TechIcon size={18} />
                            <span className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
                              {tech.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
