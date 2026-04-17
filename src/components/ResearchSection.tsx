"use client";

import { useTranslations } from "next-intl";
import { m } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ExternalLink } from "lucide-react";

type Publication = {
  authors: string;
  year: number;
  title: string;
  journal: string;
  volume?: string;
  pages?: string;
  doi?: string;
  link?: string;
  type: "journal" | "conference";
};

type PeerReviewedListItem = {
  authors: string;
  year: string | number;
  title: string;
  journal: string;
  volume?: string;
  pages?: string;
  doi?: string;
  link?: string;
};

type ConferenceListItem = {
  authors: string;
  year: string | number;
  title: string;
  conference: string;
  link?: string;
};

const ResearchSection = () => {
  const t = useTranslations("research");
  const pubT = useTranslations("publications");
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const peerReviewed = t.raw("peerReviewedList") as PeerReviewedListItem[];
  const conferencePresentations = t.raw(
    "conferencePresentationsList",
  ) as ConferenceListItem[];

  const publications: Publication[] = [
    ...peerReviewed.map((item) => ({
      authors: item.authors,
      year: Number(item.year),
      title: item.title,
      journal: item.journal,
      volume: item.volume,
      pages: item.pages,
      doi: item.doi,
      link: item.link,
      type: "journal" as const,
    })),
    ...conferencePresentations.map((item) => ({
      authors: item.authors,
      year: Number(item.year),
      title: item.title,
      journal: item.conference,
      link: item.link,
      type: "conference" as const,
    })),
  ]
    .filter((p) => Number.isFinite(p.year))
    .sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      if (a.type !== b.type) return a.type === "journal" ? -1 : 1;
      return 0;
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
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section id="research" className="pt-16 pb-20 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50 dark:from-slate-900/80 dark:via-slate-950 dark:to-slate-900/50" ref={ref}>
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="text-sm font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
            {t("academicResearch")}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
            {t("title")}
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>


        {/* Publications */}
        <m.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-20"
        >
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-12 text-center">
            {t("publications")}
          </h3>
          
          <m.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="space-y-6 max-w-4xl mx-auto"
          >
            {publications.map((pub, index) => (
              <m.div
                key={index}
                variants={itemVariants}
                className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-200"
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
                        {t("doi")}
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
              </m.div>
            ))}
          </m.div>

        </m.div>
      </div>
    </section>
  );
};

export default ResearchSection;
