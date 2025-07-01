"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Clock, BookOpen, Target, ArrowLeft, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ScheduleLessonContent() {
  const t = useTranslations("teaching");
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSite = searchParams.get('from') === 'site';
  const [showEmergency, setShowEmergency] = useState(false);

  useEffect(() => {
    // Hide navigation and footer for this page
    const nav = document.querySelector('nav');
    const footer = document.querySelector('footer');
    if (nav) nav.style.display = 'none';
    if (footer) footer.style.display = 'none';

    return () => {
      // Restore navigation and footer when leaving the page
      if (nav) nav.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {fromSite && (
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("back")}
          </button>
        )}
        
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t("scheduleLessonTitle")}
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {/* 1 Hour Lesson */}
            <a
              href="https://calendar.notion.so/meet/liangzhen84i/j1h"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white dark:bg-slate-800 rounded-xl p-6 hover:shadow-lg transition-all border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-500 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {t("lesson1Hour")}
                    </h3>
                  </div>
                </div>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {t("scheduleNow")} →
                </span>
              </div>
            </a>

            {/* 2 Hour Lesson */}
            <a
              href="https://calendar.notion.so/meet/liangzhen84i/j2h"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white dark:bg-slate-800 rounded-xl p-6 hover:shadow-lg transition-all border border-green-200 dark:border-green-700 hover:border-green-300 dark:hover:border-green-600 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-green-500 p-3 rounded-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {t("lesson2Hour")}
                    </h3>
                  </div>
                </div>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {t("scheduleNow")} →
                </span>
              </div>
            </a>

            {/* Emergency Section Toggle */}
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <button
                onClick={() => setShowEmergency(!showEmergency)}
                className="w-full flex items-center justify-between p-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium">{t("noSuitableTime")}</span>
                </div>
                {showEmergency ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {showEmergency && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      {t("emergencyNotice")}
                    </p>
                  </div>
                  
                  <a
                    href="https://calendar.notion.so/meet/liangzhen84i/j2he"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white dark:bg-slate-800 rounded-xl p-6 hover:shadow-lg transition-all border border-orange-300 dark:border-orange-600 hover:border-orange-400 dark:hover:border-orange-500 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-orange-500 p-3 rounded-lg">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {t("lessonEmergency")}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {t("lessonEmergencyDescription")}
                          </p>
                        </div>
                      </div>
                      <span className="text-orange-600 dark:text-orange-400 font-medium">
                        {t("scheduleNow")} →
                      </span>
                    </div>
                  </a>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleLessonPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScheduleLessonContent />
    </Suspense>
  );
}