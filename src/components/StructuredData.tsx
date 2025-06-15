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
        "PhD Student",
        "Chief Technology Officer",
        "AI Researcher",
        "Japanese Language Teacher",
        "Full-Stack Developer",
      ],

      description:
        locale === "en"
          ? "PhD candidate at Kyoto University researching AI applications in language education. Developing innovative machine learning solutions for second language acquisition and Japanese language teaching methodologies."
          : locale === "zh"
            ? "京都大学博士研究生，专注于人工智能在语言教育中的应用研究。开发基于机器学习的第二语言习得支持系统，推进日语教育方法论的技术革新。"
            : "京都大学大学院博士課程で言語教育とAI技術の融合を研究。機械学習を活用した日本語教育システムの開発と、外国語習得支援技術の革新に取り組んでいます。",
      url: "https://ryosh.in",
      image: "https://ryosh.in/logo.svg",
      sameAs: [
        "https://github.com/ryoshin0830",
        "https://x.com/ryoshin0830",
        "https://zenn.dev/ryoushin",
        "https://matsunoha.eastlinker.com",
      ],

      worksFor: [
        {
          "@type": "Organization",
          name: "Kyoto University",
          url: "https://www.kyoto-u.ac.jp/",
        },
        {
          "@type": "Organization",
          name: "EastLinker Inc.",
          foundingDate: "2023",
          founder: {
            "@type": "Person",
            name: "梁震（りょう しん）",
          },
        },
      ],

      alumniOf: [
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
      birthDate: "1997-08-30",
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
        addressLocality: "Kyoto",
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
        ? "Personal portfolio of LIANG ZHEN (RYO SHIN), PhD student and AI researcher specializing in language education technology and second language acquisition"
        : locale === "zh"
          ? "梁震个人作品集，京都大学博士研究生，AI研究者，专注于语言教育技术与第二语言习得研究"
          : "梁震（りょう しん）のポートフォリオサイト。京都大学博士課程・AI研究者。言語教育技術と第二言語習得の研究に専念",
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
      "https://zenn.dev/ryoushin",
      "https://matsunoha.eastlinker.com"
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
