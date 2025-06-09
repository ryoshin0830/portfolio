"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ExternalLink, Smartphone, Globe, Brain, BookOpen } from "lucide-react";
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
} from "react-icons/si";

const ProjectsSection = () => {
  const t = useTranslations("projects");

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
    return SiReactnative; // Default icon
  };

  const projects = projectsList.map((project, index) => {
    const icons = [Smartphone, Globe, BookOpen, Brain];
    const colors = ["blue", "green", "purple", "red"];
    const statuses = ["completed", "active", "completed", "ongoing"];
    const years = ["2022-2023", "2023-2024", "2021-2022", "2023-現在"];

    return {
      ...project,
      icon: icons[index],
      color: colors[index],
      status: statuses[index],
      year: years[index],
      technologies: project.technologies.map((tech) => ({
        name: tech,
        icon: getTechIcon(tech),
      })),
      links:
        index === 1 ? { live: "https://matsunoha.eastlinker.com" } : undefined,
    };
  });

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
          label: "完了",
          color:
            "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
        };
      case "active":
        return {
          label: "運用中",
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
        };
      case "ongoing":
        return {
          label: "進行中",
          color:
            "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
        };
      default:
        return {
          label: "未定",
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
        };
    }
  };

  return (
    <section
      id="projects"
      className="py-20 bg-slate-50 dark:bg-slate-800"
      data-oid="zbed2j0"
    >
      <div className="container mx-auto px-4" data-oid="ww3mrys">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          data-oid="88st:pt"
        >
          <h2
            className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-4"
            data-oid="1.5bjme"
          >
            {t("title")}
          </h2>
          <p
            className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
            data-oid="x7k5m8a"
          >
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          data-oid="2xp57we"
        >
          {projects.map((project, index) => {
            const colors = getColorClasses(project.color);
            const IconComponent = project.icon;
            const statusBadge = getStatusBadge(project.status);

            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`p-6 rounded-xl border ${colors.bg} ${colors.border} hover:shadow-lg transition-all duration-300 group`}
                whileHover={{ scale: 1.02 }}
                data-oid="qezfn:f"
              >
                {/* Header */}
                <div
                  className="flex items-start justify-between mb-4"
                  data-oid="8oli7.:"
                >
                  <div className="flex items-center" data-oid="59gvf3y">
                    <div
                      className={`p-3 rounded-lg ${colors.accent} text-white mr-4`}
                      data-oid="r_2mnlj"
                    >
                      <IconComponent size={24} data-oid="4gv_gjk" />
                    </div>
                    <div data-oid="ci212v_">
                      <h3
                        className="text-xl font-bold text-slate-800 dark:text-white mb-1"
                        data-oid="gasol1k"
                      >
                        {project.title}
                      </h3>
                      <div
                        className="flex items-center space-x-2"
                        data-oid="tn-96-y"
                      >
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}
                          data-oid="vrecme."
                        >
                          {statusBadge.label}
                        </span>
                        <span
                          className="text-sm text-slate-500 dark:text-slate-400"
                          data-oid="mi06uxu"
                        >
                          {project.year}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Links */}
                  {project.links && (
                    <div className="flex space-x-2" data-oid="j4bgofz">
                      {project.links.live && (
                        <motion.a
                          href={project.links.live}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-2 rounded-lg ${colors.text} hover:bg-white dark:hover:bg-slate-700 transition-colors duration-200`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          data-oid="hr3n67z"
                        >
                          <ExternalLink size={18} data-oid="myc9hc:" />
                        </motion.a>
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                <p
                  className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed"
                  data-oid=":_sokt7"
                >
                  {project.description}
                </p>

                {/* Features */}
                <div className="mb-4" data-oid="6soppjl">
                  <h4
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                    data-oid="7c5:pf1"
                  >
                    主な機能・特徴
                  </h4>
                  <ul className="space-y-1" data-oid="ogp038a">
                    {project.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="text-sm text-slate-600 dark:text-slate-400 flex items-center"
                        data-oid="345:ttf"
                      >
                        <span
                          className={`w-1.5 h-1.5 ${colors.accent} rounded-full mr-2`}
                          data-oid="vmfsz:r"
                        />

                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Technologies */}
                <div data-oid="nko:t.c">
                  <h4
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3"
                    data-oid="hzc1qiq"
                  >
                    技術スタック
                  </h4>
                  <div className="flex flex-wrap gap-3" data-oid="-9a33kw">
                    {project.technologies.map((tech, techIndex) => {
                      const TechIcon = tech.icon;
                      return (
                        <motion.div
                          key={techIndex}
                          className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"
                          whileHover={{ scale: 1.05 }}
                          data-oid="j9-6t:s"
                        >
                          <TechIcon size={16} data-oid="xa24nb5" />
                          <span
                            className="text-sm text-slate-700 dark:text-slate-300 font-medium"
                            data-oid="qjpxf2t"
                          >
                            {tech.name}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default ProjectsSection;
