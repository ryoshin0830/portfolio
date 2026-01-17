"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, Smartphone, Globe, Brain, BookOpen, Rocket, Star, Users } from "lucide-react";
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
  
  // Get leadership data from translations
  const leadership = t.raw("leadership") as {
    title: string;
    description: string;
    skills: string[];
  };

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


  const getColorClasses = (_color: string) => {
    return {
      bg: "bg-slate-50 dark:bg-slate-900",
      border: "border-slate-200 dark:border-slate-700",
      accent: "bg-blue-600",
      text: "text-blue-600 dark:text-blue-400",
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return {
          label: tStatus("completed"),
          color:
            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
        };
      case "active":
        return {
          label: tStatus("active"),
          color:
            "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
        };
      case "ongoing":
        return {
          label: tStatus("ongoing"),
          color:
            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
        };
      default:
        return {
          label: tStatus("undefined"),
          color:
            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
        };
    }
  };

  return (
    <section id="projects" className="pt-32 pb-24 bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-full text-sm font-medium mb-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <Rocket size={16} />
            {tBadges("featuredProjects")}
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-slate-900 dark:text-white mb-6 tracking-tight">
            {t("title")}
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Leadership Section */}
        <div className="mb-16">
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-sm">
                <Users size={32} />
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">
                  {leadership.title}
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  {leadership.description}
                </p>
                <div className="flex flex-wrap gap-3">
                  {leadership.skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full text-sm font-semibold border border-slate-200 dark:border-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
                className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-4 rounded-2xl ${colors.accent} text-white shadow-sm transition-transform duration-200`}>
                        <IconComponent size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.color} transition-transform duration-200`}>
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
                            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-blue-600 dark:text-blue-400"
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
                          <div className={`w-3 h-3 ${colors.accent} rounded-full mt-1.5 flex-shrink-0`} />
                          <span className="font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Technologies */}
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      {t("techStack")}
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {project.technologies.map((tech, techIndex) => {
                        const TechIcon = tech.icon;
                        return (
                          <div
                            key={techIndex}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
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
