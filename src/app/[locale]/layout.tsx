import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import Navigation from "@/components/Navigation";
import StructuredData from "@/components/StructuredData";
import "../globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

// メタデータを動的に生成する関数に変更
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const lang = ["en", "zh"].includes(locale) ? locale : "ja";

  const metaByLocale: Record<string, { title: string; description: string; keywords: string }> = {
    ja: {
      title: "梁震（りょう しん）| AI研究者・起業家・日本語教師",
      description:
        "京都大学博士課程・株式会社EastLinker代表取締役。外国語教育学とAI技術を融合した研究と開発を行っています。",
      keywords:
        "梁震, りょうしん, RYO SHIN, LIANG ZHEN, 京都大学, AI研究, 言語教育, LLM, 機械学習, 日本語教師, EastLinker, ポートフォリオ",
    },
    en: {
      title: "Ryo Shin (Liang Zhen) | AI Researcher, Entrepreneur & Japanese Teacher",
      description:
        "Official portfolio of Ryo Shin, PhD student at Kyoto University and CEO of EastLinker Inc., specialising in AI-powered language education.",
      keywords:
        "Ryo Shin, Liang Zhen, AI researcher, Kyoto University, Japanese language teacher, Large Language Models, Machine Learning, Portfolio, EastLinker",
    },
    zh: {
      title: "梁震 | AI研究者、企业家、日语教师",
      description:
        "梁震，京都大学博士生，EastLinker创始人。致力于AI与语言教育融合的研究与应用的个人作品集。",
      keywords:
        "梁震, AI研究, 京都大学, 日语教师, 大语言模型, 机器学习, EastLinker, 个人作品集",
    },
  };

  const selected = metaByLocale[lang];

  return {
    ...selected,
    authors: [{ name: "梁震（りょう しん）" }],
    creator: "梁震（りょう しん）",
    publisher: "梁震（りょう しん）",
    robots: "index, follow",
    metadataBase: new URL("https://ryosh.in"),
    openGraph: {
      type: "website",
      locale: lang === "ja" ? "ja_JP" : lang === "en" ? "en_US" : "zh_CN",
      url: "https://ryosh.in",
      title: selected.title,
      description: selected.description,
      siteName: "梁震（りょう しん）ポートフォリオ",
      images: [
        {
          url: "https://ryosh.in/logo.png",
          width: 1200,
          height: 630,
          alt: selected.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@ryoshin0830",
      creator: "@ryoshin0830",
      title: selected.title,
      description: selected.description,
      images: ["https://ryosh.in/logo.png"],
    },
    alternates: {
      canonical: "https://ryosh.in",
      languages: {
        ja: "/ja",
        en: "/en",
        zh: "/zh",
      },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale and provide default
  const validLocale =
    locale && ["ja", "en", "zh"].includes(locale) ? locale : "ja";
  const messages = await getMessages({ locale: validLocale });

  return (
    <html lang={validLocale} className="scroll-smooth" data-oid="bphv6.8">
      <head data-oid="8k2pgtd">
        {/* Preconnect for fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/* Favicon */}
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <StructuredData locale={validLocale} data-oid="lnhag03" />

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SJ8FDYK6J7"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);} 
            gtag('js', new Date());
            gtag('config', 'G-SJ8FDYK6J7');
          `}
        </Script>
      </head>
      <body
        className={`${inter.variable} ${notoSansJP.variable} font-sans antialiased bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900`}
        data-oid="1ogajcn"
      >
        <NextIntlClientProvider messages={messages} data-oid="q3ce1r0">
          <Navigation data-oid="hk5vrem" />
          <main className="min-h-screen" data-oid="cjsbd45">
            {children}
          </main>
          <footer className="bg-slate-900 text-white py-8" data-oid="9d4m8i:">
            <div
              className="container mx-auto px-4 text-center"
              data-oid="67z3cll"
            >
              <p className="text-sm opacity-80" data-oid="lswazss">
                © 2024 梁震（りょう しん）. All rights reserved.
              </p>
              <p className="text-xs opacity-60 mt-2" data-oid="ujmiq13">
                Built with Next.js, TypeScript, and Tailwind CSS
              </p>
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
