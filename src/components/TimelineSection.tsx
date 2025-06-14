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
  Briefcase,
} from "lucide-react";
import Image from "next/image";

const TimelineSection = () => {
  const t = useTranslations("about");
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
      "china", // 2013 high school
      "china", // 2016 university
      "china", // 2020 graduation
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
        return "from-red-500 to-yellow-500";
      case "japan":
        return "from-red-500 to-white";
      default:
        return "from-blue-500 to-purple-500";
    }
  };

  const getCountryBg = (location?: string) => {
    switch (location) {
      case "china":
        return "bg-gradient-to-br from-red-50 to-yellow-50 dark:from-red-950/20 dark:to-yellow-950/20";
      case "japan":
        return "bg-gradient-to-br from-red-50 to-slate-50 dark:from-red-950/20 dark:to-slate-950/20";
      default:
        return "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20";
    }
  };

  return (
    <div ref={containerRef} className="relative py-20">
      <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-16 text-center">
        {t("timeline")}
      </h3>

      {/* Country indicators */}
      <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-full max-w-6xl mx-auto hidden lg:block">
        <div className="flex justify-between px-20">
          <div className="text-center">
            <div className="text-4xl mb-2">🇨🇳</div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">China</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">🇯🇵</div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Japan</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-5xl mx-auto mt-20">
        {/* Desktop flowing timeline paths */}
        <div className="absolute inset-0 hidden lg:block pointer-events-none">
          {eventsWithLocation.map((event, index) => {
            if (index === eventsWithLocation.length - 1) return null;
            
            const isEven = index % 2 === 0;
            const nextIsEven = (index + 1) % 2 === 0;
            
            // Calculate actual spacing based on the timeline layout
            // space-y-32 = 8rem = 128px between cards
            // Each card is approximately 200-250px in height
            const cardSpacing = 128; // tailwind space-y-32
            const cardHeight = 220; // estimated card height
            const totalSpacing = cardSpacing + cardHeight;
            
            // Position from center of current card to center of next card
            const yStart = index * totalSpacing + (cardHeight / 2);
            const yEnd = (index + 1) * totalSpacing + (cardHeight / 2);
            
            return (
              <motion.svg
                key={`flow-${index}`}
                className="absolute w-full overflow-visible"
                style={{ 
                  top: `${yStart}px`, 
                  height: `${yEnd - yStart}px` 
                }}
                viewBox="0 0 800 400"
                preserveAspectRatio="none"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: index * 0.05 }}
              >
                <defs>
                  <linearGradient id={`flow-gradient-${index}`}>
                    <stop offset="0%" stopColor={event.location === 'china' ? '#ef4444' : event.location === 'japan' ? '#3b82f6' : '#8b5cf6'} stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3" />
                  </linearGradient>
                  <filter id={`glow-${index}`}>
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Flowing path */}
                <motion.path
                  d={
                    isEven
                      ? nextIsEven
                        ? "M 200 10 Q 150 200, 200 390" // 左→左 (gentle curve)
                        : "M 200 10 Q 300 200, 600 390" // 左→右 (flowing S-curve)
                      : nextIsEven
                        ? "M 600 10 Q 500 200, 200 390" // 右→左 (flowing S-curve)
                        : "M 600 10 Q 650 200, 600 390" // 右→右 (gentle curve)
                  }
                  stroke={`url(#flow-gradient-${index})`}
                  strokeWidth="3"
                  fill="none"
                  filter={`url(#glow-${index})`}
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    pathLength: { duration: 1.5, delay: index * 0.1, ease: "easeInOut" }
                  }}
                />
                
                {/* Flowing particles */}
                {[...Array(3)].map((_, i) => (
                  <motion.circle
                    key={`particle-${index}-${i}`}
                    r="2"
                    fill={event.location === 'china' ? '#fbbf24' : '#60a5fa'}
                    filter={`url(#glow-${index})`}
                  >
                    <animateMotion
                      dur={`${3 + i}s`}
                      repeatCount="indefinite"
                      begin={`${i * 0.5}s`}
                      path={
                        isEven
                          ? nextIsEven
                            ? "M 200 10 Q 150 200, 200 390"
                            : "M 200 10 Q 300 200, 600 390"
                          : nextIsEven
                            ? "M 600 10 Q 500 200, 200 390"
                            : "M 600 10 Q 650 200, 600 390"
                      }
                    />
                  </motion.circle>
                ))}
              </motion.svg>
            );
          })}
        </div>

        {/* Mobile central line */}
        <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 lg:hidden" />

        {/* Timeline events */}
        <div className="relative space-y-16 lg:space-y-32">
          {eventsWithLocation.map((event, index) => {
            const Icon = getTimelineIcon(event.icon);
            const isPlaneEvent = event.icon === "plane";
            const isKyotoEvent = event.title.includes("京都大学");
            const isStartupEvent = event.icon === "rocket";

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
                <div className="absolute -left-20 top-8 w-4 h-4 bg-white dark:bg-slate-900 rounded-full border-2 border-blue-400 shadow-lg lg:hidden z-10" />

                {/* Desktop timeline dot - positioned at card edge */}
                <div className={`absolute hidden lg:block w-6 h-6 bg-white dark:bg-slate-900 rounded-full shadow-lg z-20 ${
                  index % 2 === 0 ? "-right-3 top-8" : "-left-3 top-8"
                }`}>
                  <div className={`absolute inset-0.5 bg-gradient-to-r ${getCountryColor(event.location)} rounded-full`} />
                </div>
                
                {/* Connecting line from dot to card */}
                <div className={`absolute hidden lg:block top-11 h-px bg-slate-300 dark:bg-slate-600 ${
                  index % 2 === 0 
                    ? "left-1/2 right-0 transform origin-left" 
                    : "left-0 right-1/2 transform origin-right"
                }`} />

                <div
                  className={`relative p-6 lg:p-8 rounded-2xl border ${
                    event.special 
                      ? "border-yellow-300 dark:border-yellow-700 shadow-2xl" 
                      : "border-slate-200 dark:border-slate-700 shadow-lg"
                  } ${getCountryBg(event.location)} backdrop-blur-sm`}
                >
                  {/* Special badge for important events */}
                  {event.special && (
                    <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-lg">
                      MILESTONE
                    </div>
                  )}

                  {/* Kyoto University special design */}
                  {isKyotoEvent && (
                    <div className="absolute top-4 right-4 w-16 h-16 opacity-20">
                      <Image
                        src="/kyoto-u.png"
                        alt="Kyoto University"
                        width={64}
                        height={64}
                        className="rounded-full"
                      />
                    </div>
                  )}

                  {/* Startup special design */}
                  {isStartupEvent && (
                    <motion.div
                      className="absolute top-4 right-4"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 blur-xl" />
                    </motion.div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Icon with country gradient */}
                    <div className={`p-3 bg-gradient-to-br ${getCountryColor(event.location)} rounded-xl shadow-lg`}>
                      <Icon className="text-white" size={24} />
                    </div>

                    <div className="flex-1">
                      {/* Year and location */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-slate-700 dark:text-slate-300">
                          {event.year}
                        </span>
                        {event.location && (
                          <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                            <MapPin size={14} />
                            <span>{event.location === "china" ? "China" : "Japan"}</span>
                          </div>
                        )}
                      </div>

                      {/* Title with special styling */}
                      <h4 className={`text-xl font-bold mb-2 ${
                        event.special 
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" 
                          : "text-slate-900 dark:text-white"
                      }`}>
                        {event.title}
                      </h4>

                      {/* Description */}
                      <p className="text-slate-600 dark:text-slate-400">
                        {event.description}
                      </p>

                      {/* Special content for Kyoto University */}
                      {isKyotoEvent && (
                        <div className="mt-4 flex items-center gap-3">
                          <Image
                            src="/kyoto-u.png"
                            alt="Kyoto University"
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Graduate School of Human and Environmental Studies
                          </span>
                        </div>
                      )}

                      {/* Special content for startup */}
                      {isStartupEvent && (
                        <div className="mt-4 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <Briefcase size={16} className="text-purple-600" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              EastLinker Inc. - AI & EdTech
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-gradient-to-r from-pink-200 to-yellow-200 dark:from-pink-900/20 dark:to-yellow-900/20 rounded-full blur-3xl opacity-20" />
      </div>
    </div>
  );
};

export default TimelineSection;