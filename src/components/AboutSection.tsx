"use client";

import { useTranslations } from "next-intl";
import {
  Briefcase,
  Star,
  Building,
  Users,
  Calendar,
  MapPin,
  Target,
} from "lucide-react";
import Image from "next/image";

const AboutSection = () => {
  const t = useTranslations("about");


  const fields = t.raw("fields") as string[];
  const timelineEvents = t.raw("timelineEvents") as Array<{
    year: string;
    title: string;
    description: string;
  }>;

  return (
    <section id="about" className="pt-32 pb-24 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-950/50 dark:to-slate-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-6">
            <Target size={16} />
            About Me
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black gradient-text mb-6 tracking-tight">
            {t("title")}
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          {/* Profile Image */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
              <div className="relative w-96 h-96 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 dark:border-slate-800/20 backdrop-blur-sm">
                <Image
                  src="/lab.jpeg"
                  alt="Research Activity"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
              
              {/* Modern floating badges */}
              <div className="absolute -top-6 -right-6 px-6 py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-blue-200/50 dark:border-blue-700/50 rounded-2xl shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-sm font-bold text-slate-800 dark:text-white">PhD Student</span>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -left-6 px-6 py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-purple-200/50 dark:border-purple-700/50 rounded-2xl shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  <span className="text-sm font-bold text-slate-800 dark:text-white">CEO</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-10">
            {/* Current Status */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Building className="text-white" size={24} />
                </div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                  {t("currentStatus")}
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-blue-200/30 dark:border-blue-700/30 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-30" />
                      <Image
                        src="/kyoto-u.png"
                        alt="Kyoto University"
                        width={48}
                        height={48}
                        className="relative rounded-full border-2 border-white dark:border-slate-700 shadow-lg"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-slate-800 dark:text-white">
                        {t("kyotoUniversity")}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Graduate School</p>
                    </div>
                  </div>
                </div>
                
                <div className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-purple-200/30 dark:border-purple-700/30 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
                      <Briefcase className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-slate-800 dark:text-white">
                        {t("eastLinker")}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Business</p>
                    </div>
                  </div>
                </div>
                
                <div className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-emerald-200/30 dark:border-emerald-700/30 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-emerald-300 dark:hover:border-emerald-600">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                      <Users className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-slate-800 dark:text-white">
                        {t("japaneseTeacher")}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Education</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Specialization */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-lg">
                  <Star className="text-white" size={24} />
                </div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                  {t("specialization")}
                </h3>
              </div>
              
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={index}
                    className="group p-5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/30 dark:border-slate-700/30 shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
                      <p className="text-slate-700 dark:text-slate-300 font-semibold text-lg">
                        {field}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          <div className="text-center p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-blue-200/30 dark:border-blue-700/30 shadow-xl hover:shadow-2xl transition-all duration-200">
            <div className="text-5xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">
              7+
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">
              年間の教育経験
            </p>
          </div>
          
          <div className="text-center p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-purple-200/30 dark:border-purple-700/30 shadow-xl hover:shadow-2xl transition-all duration-200">
            <div className="text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              5000+
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">
              指導時間
            </p>
          </div>
          
          <div className="text-center p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-emerald-200/30 dark:border-emerald-700/30 shadow-xl hover:shadow-2xl transition-all duration-200">
            <div className="text-5xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
              300+
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">
              指導学生数
            </p>
          </div>
          
          <div className="text-center p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-rose-200/30 dark:border-rose-700/30 shadow-xl hover:shadow-2xl transition-all duration-200">
            <div className="text-5xl font-black bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent mb-3">
              95%
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">
              JLPT合格率
            </p>
          </div>
        </div>

        {/* Timeline Section */}
        <div>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-full shadow-lg mb-8">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
                <Calendar className="text-white" size={20} />
              </div>
              <span className="font-bold text-slate-800 dark:text-white">{t("timeline")}</span>
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Modern Timeline line */}
              <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500 rounded-full" />

              {timelineEvents.map((event, index) => (
                <div
                  key={index}
                  className={`relative flex items-center mb-16 ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Modern Timeline dot */}
                  <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 w-6 h-6 bg-white dark:bg-slate-900 rounded-full border-4 border-blue-500 shadow-xl z-10">
                    <div className="absolute inset-1 bg-blue-500 rounded-full" />
                  </div>

                  {/* Content */}
                  <div className={`flex-1 ml-20 md:ml-0 ${index % 2 === 0 ? "md:pr-16" : "md:pl-16"}`}>
                    <div className="group p-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-slate-200/30 dark:border-slate-700/30 shadow-xl hover:shadow-2xl transition-all duration-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-lg">
                          <span className="font-bold text-sm">{event.year}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <MapPin size={16} />
                          <span className="text-sm">Experience</span>
                        </div>
                      </div>
                      
                      <h4 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        {event.title}
                      </h4>
                      
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                        {event.description}
                      </p>
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

export default AboutSection;
