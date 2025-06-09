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
        "CEO",
        "Researcher",
        "Japanese Language Teacher",
        "Full-Stack Developer",
      ],

      description:
        locale === "en"
          ? "PhD Student at Kyoto University, CEO of EastLinker Inc., specializing in foreign language education and AI technology"
          : locale === "zh"
            ? "京都大学博士生，EastLinker株式会社代表取締役，专门从事外语教育学与AI技术融合研究"
            : "京都大学博士課程・株式会社EastLinker代表取締役。外国語教育学とAI技術を融合した研究と開発を行っています。",
      url: "https://ryosh.in",
      image: "https://ryosh.in/logo.png",
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
        ? "Personal portfolio of LIANG ZHEN (RYO SHIN), PhD student, researcher, and entrepreneur specializing in AI and language education"
        : locale === "zh"
          ? "梁震个人作品集，京都大学博士生，研究员，企业家，专门从事AI和语言教育"
          : "梁震（りょう しん）のポートフォリオサイト。京都大学博士課程・株式会社EastLinker代表取締役",
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getPersonData()),
        }}
        data-oid="u5hej1f"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getWebsiteData()),
        }}
        data-oid="11g7sq5"
      />
    </>
  );
};

export default StructuredData;
