"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

interface Publication {
  authors: string;
  year: number;
  title: string;
  journal: string;
  volume?: string;
  pages?: string;
  doi?: string;
  link?: string;
}

export default function PublicationsSection() {
  const t = useTranslations("publications");
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const publications: Publication[] = [
    {
      authors: "中野 珠悠・梁 震・笹尾 洋介",
      year: 2024,
      title: "英語検定教科書コーパスに基づく高頻度コロケーションの分析",
      journal: "全国英語教育学会 JASELE 第49回福岡研究大会",
    },
    {
      authors: "梁 震・笹尾 洋介",
      year: 2024,
      title: "汎用言語モデルは日本語学習者データに基づく語彙難易度を予測できるのか",
      journal: "言語処理学会2024",
    },
    {
      authors: "彭 悦, 梁 震, 笹尾 洋介",
      year: 2023,
      title: "日中バイリンガルの音声版日本語語彙サイズテストの開発と検証",
      journal: "日本語教育",
      volume: "185",
      pages: "93–108",
      link: "https://www.nkg.or.jp/gakkaishi/yomu/2023_08_25.html",
    },
    {
      authors: "Vincent, N. H., Liang, Z., & Sasao, Y.",
      year: 2023,
      title: "Motion and memory in VR: The influence of VR control method on memorization of foreign language orthography",
      journal: "International Journal on Cybernetics & Informatics (IJCI)",
      volume: "12(1)",
      pages: "151–164",
      link: "https://ijcionline.com/paper/12/12123ijci12.pdf",
    },
    {
      authors: "彭 悦, 梁 震, 笹尾 洋介",
      year: 2022,
      title: "日本語学習における映像作品の字幕利用ー言語選択の視点からー",
      journal: "言語文化教育研究",
      volume: "20",
      pages: "335–356",
      doi: "https://doi.org/10.14960/gbkkg.20.335",
    },
    {
      authors: "彭 悦・梁 震・笹尾 洋介",
      year: 2022,
      title: "日中バイリンガルの音声版日本語語彙サイズテストの開発と検証",
      journal: "日本語教育学会秋季大会予稿集",
    },
    {
      authors: "梁 震・笹尾 洋介",
      year: 2022,
      title: "日本語語彙問題の選択肢自動生成プログラムの開発と検証",
      journal: "日本語教育学会春季大会予稿集",
    },
  ];

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
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section id="publications" className="py-20" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
        >
          {t("title")}
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="space-y-6 max-w-4xl mx-auto"
        >
          {publications.map((pub, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                  {pub.title}
                </h3>
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full">
                  {pub.year}
                </span>
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
                      DOI →
                    </a>
                  )}
                  {pub.link && (
                    <a
                      href={pub.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {t("viewPaper")} →
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-gray-600 dark:text-gray-400"
        >
          {t("totalPublications", { count: publications.length })}
        </motion.p>
      </div>
    </section>
  );
}