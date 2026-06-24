interface StructuredDataProps {
  locale: string;
}

const StructuredData = ({ locale }: StructuredDataProps) => {
  const getPersonData = () => {
    const baseData = {
      "@context": "https://schema.org",
      "@type": "Person",
      name:
        locale === "en"
          ? "LIANG ZHEN (RYO SHIN)"
          : locale === "zh"
            ? "梁震"
            : "梁震（りょう しん）",
      alternateName: ["梁震", "りょう しん", "RYO SHIN", "LIANG ZHEN"],
      jobTitle: [
        "Engineer",
        "ML Engineer",
        "Researcher",
      ],

      description:
        locale === "en"
          ? "PhD from Kyoto University and ML engineer working on AI applications in language education. Builds machine learning solutions for second language acquisition and Japanese language education methodologies."
          : locale === "zh"
            ? "京都大学博士，ML 工程师，专注于人工智能在语言教育中的应用研究。开发基于机器学习的第二语言习得支持系统，推进日语教育方法论的技术革新。"
            : "京都大学大学院で博士号を取得し、言語教育とAI技術の融合を研究。機械学習を活用した日本語教育システムの開発と、外国語習得支援技術の革新に取り組んでいます。",
      url: "https://ryosh.in",
      image: "https://ryosh.in/logo.svg",
      sameAs: [
        "https://github.com/ryoshin0830",
        "https://x.com/ryoshin0830",
        "https://zenn.dev/ryoushin",
      ],

      worksFor: [
        {
          "@type": "Organization",
          name: "GMO Pepabo, Inc.",
          url: "https://pepabo.com/",
          department: {
            "@type": "Organization",
            name: "Lolipop & Muumuu Domain Division, Rental Server Team",
          },
        },
      ],

      hasOccupation: [
        {
          "@type": "Occupation",
          name: "Engineer — Lolipop! Rental Server",
          occupationLocation: {
            "@type": "Place",
            name: "GMO Pepabo, Inc.",
          },
          startDate: "2026-04",
        },
        {
          "@type": "Occupation",
          name: "Engineer (Contract)",
          occupationLocation: {
            "@type": "Place",
            name: "Sapeet Inc.",
          },
          startDate: "2026-02",
          endDate: "2026-03",
        },
        {
          "@type": "Occupation",
          name: "Full-stack Engineer (Contract) — Japanese reading platform",
          occupationLocation: {
            "@type": "Place",
            name: "Massey University, New Zealand",
          },
          startDate: "2025-06",
          endDate: "2026-03",
        },
        {
          "@type": "Occupation",
          name: "Engineer (Contract) — Medical SaaS",
          occupationLocation: {
            "@type": "Place",
            name: "medimo Inc.",
          },
          startDate: "2025-06",
          endDate: "2026-01",
        },
        {
          "@type": "Occupation",
          name: "Project Lead (Contract) — Vocabulary Profiler",
          occupationLocation: {
            "@type": "Place",
            name: "NINJAL — National Institute for Japanese Language and Linguistics",
          },
          startDate: "2023-11",
          endDate: "2025-03",
        },
      ],

      alumniOf: [
        {
          "@type": "EducationalOrganization",
          name: "Kyoto University",
          location: "Kyoto, Japan",
          url: "https://www.kyoto-u.ac.jp/",
        },
        {
          "@type": "EducationalOrganization",
          name: "Capital University of Economics and Business",
          location: "Beijing, China",
        },
      ],

      knowsAbout: [
        "Foreign Language Education",
        "Second Language Acquisition",
        "Applied Linguistics",
        "Large Language Models (LLM)",
        "Machine Learning",
        "Natural Language Processing",
        "Full-Stack Development",
        "React",
        "Next.js",
        "Python",
        "JavaScript",
        "TypeScript",
      ],

      knowsLanguage: [
        {
          "@type": "Language",
          name: "Japanese",
          alternateName: "日本語",
        },
        {
          "@type": "Language",
          name: "Chinese",
          alternateName: "中文",
        },
        {
          "@type": "Language",
          name: "English",
          alternateName: "英語",
        },
      ],

      award: [
        "JLPT N1 Perfect Score",
        "CET Level 4",
        "ICT Proficiency Test Level 2",
      ],

      email: "ryo.shin.j85@kyoto-u.jp",
      birthPlace: {
        "@type": "Place",
        name: "Beijing, China",
      },
      nationality: {
        "@type": "Country",
        name: "China",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Tokyo",
        addressCountry: "Japan",
      },
    };

    return baseData;
  };

  const getWebsiteData = () => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "梁震（りょう しん）ポートフォリオ",
    alternateName: ["RYO SHIN Portfolio", "LIANG ZHEN Portfolio"],
    url: "https://ryosh.in",
    description:
      locale === "en"
        ? "Personal portfolio of LIANG ZHEN (RYO SHIN), PhD and ML engineer specializing in language education technology and second language acquisition"
        : locale === "zh"
          ? "梁震个人作品集，京都大学博士，工程师，专注于语言教育技术与第二语言习得研究"
          : "梁震（りょう しん）のポートフォリオサイト。京都大学にて博士号取得・エンジニア。言語教育技術と第二言語習得の研究に専念",
    inLanguage: [locale],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://ryosh.in/?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  });

  const getOrganizationData = () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: locale === "en" ? "RYO SHIN" : locale === "zh" ? "梁震" : "梁震（りょう しん）",
    url: "https://ryosh.in",
    logo: {
      "@type": "ImageObject",
      url: "https://ryosh.in/logo.svg",
      contentUrl: "https://ryosh.in/logo.svg",
      caption: locale === "en" ? "RYO SHIN Logo" : locale === "zh" ? "梁震标志" : "梁震（りょう しん）ロゴ"
    },
    founder: {
      "@type": "Person",
      name: locale === "en" ? "LIANG ZHEN (RYO SHIN)" : locale === "zh" ? "梁震" : "梁震（りょう しん）"
    },
    sameAs: [
      "https://github.com/ryoshin0830",
      "https://x.com/ryoshin0830",
      "https://zenn.dev/ryoushin"
    ]
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getPersonData()),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getWebsiteData()),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getOrganizationData()),
        }}
      />
    </>
  );
};

export default StructuredData;
