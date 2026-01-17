"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useRef } from "react";
import {
  Baby,
  Plane,
  Home,
  GraduationCap,
  School,
  University,
  Rocket,
  Calendar,
  MapPin,
} from "lucide-react";
import Image from "next/image";

const TimelineSection = () => {
  const t = useTranslations("about");
  const locationsT = useTranslations("locations");
  const containerRef = useRef<HTMLDivElement>(null);

  const timelineEvents = t.raw("timelineEvents") as Array<{
    year: string;
    title: string;
    description: string;
    icon?: string;
  }>;

  // Add location data to events
  const eventsWithLocation = timelineEvents.map((event, index) => {
    const locations: ("china" | "japan" | undefined)[] = [
      "china", // 1997 birth
      "japan", // 1999 move to Japan
      "china", // 2009 back to China
      "japan", // 2010 permanent residence
      "china", // 2016 university
      "japan", // 2021 Kyoto
      "japan", // 2023 startup
    ];
    return {
      ...event,
      location: locations[index],
      special: event.icon === "rocket" || event.icon === "university",
    };
  });

  const getTimelineIcon = (icon?: string) => {
    switch (icon) {
      case "birth": return Baby;
      case "plane": return Plane;
      case "home": return Home;
      case "school": return School;
      case "university": return University;
      case "graduation": return GraduationCap;
      case "rocket": return Rocket;
      default: return Calendar;
    }
  };

  const getCountryColor = (location?: string) => {
    switch (location) {
      case "china":
        return "bg-red-500";
      case "japan":
        return "bg-slate-500";
      default:
        return "bg-blue-500";
    }
  };

  const getCountryBg = (location?: string) => {
    switch (location) {
      case "china":
        return "bg-red-50 dark:bg-slate-900";
      case "japan":
        return "bg-slate-50 dark:bg-slate-900";
      default:
        return "bg-blue-50 dark:bg-slate-900";
    }
  };

  return (
    <div ref={containerRef} className="relative py-20">
      <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-16 text-center">
        {t("timeline")}
      </h3>


      <div className="relative max-w-5xl mx-auto mt-20">
        <div className="absolute inset-y-0 left-1/2 hidden lg:block w-px bg-slate-200 dark:bg-slate-700" />
        <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700 lg:hidden" />

        {/* Timeline events */}
        <div className="relative space-y-16 lg:space-y-32">
          {eventsWithLocation.map((event, index) => {
            const Icon = getTimelineIcon(event.icon);
            const isPlaneEvent = event.icon === "plane";
            const isKyotoEvent = event.title.includes("京都大学") || event.title.includes("修士") || event.title.includes("博士");
            const isStartupEvent = event.icon === "rocket" || event.title.includes("起業");

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative ${
                  index % 2 === 0 ? "lg:pr-1/2" : "lg:pl-1/2 lg:ml-auto"
                } lg:w-1/2 ml-20 lg:ml-0`}
              >
                {/* Plane animation for travel events */}
                {isPlaneEvent && (
                  <motion.div
                    className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-20"
                    initial={{ x: event.location === "japan" ? -200 : 200, y: -50 }}
                    whileInView={{ x: 0, y: 0 }}
                    transition={{ duration: 1.5, type: "spring" }}
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Plane className="text-blue-500 w-12 h-12" />
                      </motion.div>
                      <motion.div
                        className="absolute -bottom-4 left-1/2 transform -translate-x-1/2"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* Mobile timeline dot */}
                <div className="absolute -left-20 top-8 w-4 h-4 bg-white dark:bg-slate-900 rounded-full border-2 border-slate-300 dark:border-slate-600 shadow-sm lg:hidden z-10" />

                {/* Desktop timeline dot - positioned at card edge */}
                <div className={`absolute hidden lg:block w-6 h-6 bg-white dark:bg-slate-900 rounded-full shadow-sm z-20 border border-slate-200 dark:border-slate-700 ${
                  index % 2 === 0 ? "-right-3 top-8" : "-left-3 top-8"
                }`}>
                  <div className={`absolute inset-1 ${getCountryColor(event.location)} rounded-full`} />
                </div>
                
                {/* Connecting line from dot to card */}
                <div className={`absolute hidden lg:block top-11 h-px bg-slate-300 dark:bg-slate-600 ${
                  index % 2 === 0 
                    ? "left-1/2 right-0 transform origin-left" 
                    : "left-0 right-1/2 transform origin-right"
                }`} />

                <motion.div
                  className={`relative p-6 lg:p-8 rounded-2xl border ${
                    isKyotoEvent 
                      ? "border-blue-300 dark:border-blue-600 shadow-md" 
                      : isStartupEvent
                      ? "border-slate-300 dark:border-slate-600 shadow-md"
                      : event.special 
                      ? "border-amber-300 dark:border-amber-600 shadow-sm" 
                      : "border-slate-200 dark:border-slate-700 shadow-sm"
                  } ${getCountryBg(event.location)} overflow-hidden`}
                  whileHover={{ 
                    scale: 1.02,
                    transition: { type: "spring", stiffness: 300 }
                  }}
                >
                  {/* Watermark logo for Kyoto University */}
                  {isKyotoEvent && (
                    <div className="absolute -top-6 -right-6 w-40 h-40 opacity-10 dark:opacity-5">
                      <Image
                        src="/kyoto-u-logo.svg"
                        alt="Kyoto University"
                        width={160}
                        height={160}
                      />
                    </div>
                  )}

                  {/* Watermark logo for EastLinker */}
                  {isStartupEvent && (
                    <div className="absolute -top-6 -right-6 w-48 h-48 opacity-10 dark:opacity-5">
                      <Image
                        src="/eastlinker_logo.svg"
                        alt="EastLinker Inc."
                        width={192}
                        height={192}
                      />
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Icon with unified design */}
                    <motion.div 
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Icon className="text-slate-700 dark:text-slate-200" size={24} />
                    </motion.div>

                    <div className="flex-1">
                      {/* Year and location */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-slate-700 dark:text-slate-300">
                          {event.year}
                        </span>
                        {event.location && (
                          <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                            <MapPin size={14} />
                            <span>{locationsT(event.location)}</span>
                          </div>
                        )}
                      </div>

                      {/* Title with special styling */}
                      <h4 className={`text-xl font-bold mb-2 ${
                        event.special 
                          ? "text-blue-600 dark:text-blue-400" 
                          : "text-slate-900 dark:text-white"
                      }`}>
                        {event.title}
                      </h4>

                      {/* Description */}
                      <p className="text-slate-600 dark:text-slate-400">
                        {event.description}
                      </p>

                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default TimelineSection;
