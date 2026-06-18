import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import Navigation from "@/components/Navigation";
import ContactModal from "@/components/ContactModal";
import MotionProvider from "@/components/MotionProvider";
import StructuredData from "@/components/StructuredData";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { themeScript } from "../theme-script";
import "../globals.css";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
// Hero の名前専用のディスプレイ明朝（Black のみ — 細いウェイトの明朝は超大型
// サイズで貧弱に見える）。日本語フォントは next/font が unicode-range でスライス
// 配信するため、使用グリフ分しかダウンロードされない。
const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  variable: "--font-noto-serif-jp",
  display: "swap",
  weight: ["900"],
});

// 3 ロケールをビルド時にプリレンダリングする（これがないと全ページが
// リクエストごとの SSR になり、Vercel の Function を毎回起動してしまう）。
export function generateStaticParams() {
  return [{ locale: "ja" }, { locale: "en" }, { locale: "zh" }];
}

// メタデータを動的に生成する関数に変更
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const validLocale = ["en", "zh"].includes(locale) ? locale : "ja";
  const messages = await getMessages({ locale: validLocale });

  const title = messages.metadata.title as string;
  const description = messages.metadata.description as string;
  const keywords = messages.metadata.keywords as string;
  const author = messages.metadata.author as string;
  const creator = messages.metadata.creator as string;
  const publisher = messages.metadata.publisher as string;
  const siteName = messages.metadata.siteName as string;

  return {
    title,
    description,
    keywords,
    authors: [{ name: author }],
    creator,
    publisher,
    robots: "index, follow",
    metadataBase: new URL("https://ryosh.in"),
    openGraph: {
      type: "website",
      locale: validLocale === "ja" ? "ja_JP" : validLocale === "en" ? "en_US" : "zh_CN",
      url: "https://ryosh.in",
      title,
      description,
      siteName,
      images: [
        {
          url: "https://ryosh.in/og-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@ryoshin0830",
      creator: "@ryoshin0830",
      title,
      description,
      images: ["https://ryosh.in/og-image.png"],
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
  // 静的レンダリングを有効化（getTranslations/getLocale がリクエストヘッダーを
  // 読まずに済むようロケールを確定させる）
  setRequestLocale(validLocale);
  const messages = await getMessages({ locale: validLocale });

  return (
    <html
      lang={validLocale}
      className={`${inter.variable} ${jetbrainsMono.variable} ${notoSansJP.variable} ${notoSerifJP.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Theme script to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        
        {/* Preconnect for fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/* Favicon - PNG優先でGoogle検索結果での表示を確実にする */}
        <link rel="icon" type="image/png" sizes="48x48" href="/logo_48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/logo_96.png" />
        <link rel="shortcut icon" type="image/png" href="/logo_48.png" />
        <link rel="apple-touch-icon" sizes="96x96" href="/logo_96.png" />
        
        {/* SVGファビコン（フォールバック） */}
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="mask-icon" href="/logo.svg" color="#000000" />
        <StructuredData locale={validLocale} />

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
        className="antialiased overflow-x-hidden w-full max-w-full"
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <MotionProvider>
              {/* キーボード/スクリーンリーダー向けのスキップリンク。フォーカス時のみ
                  表示され、ページ本文 (#main) へ直接ジャンプする。 */}
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:rounded-md focus:border focus:border-[color:var(--color-rule)] focus:bg-[color:var(--color-bg)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[color:var(--color-ink)]"
              >
                {messages.nav.skipToContent}
              </a>
              <Navigation />
              {/* page.tsx 側に唯一の <main> ランドマークがある。ここはレイアウトの
                  ラッパ兼スキップリンクの着地点（id="main"）として div にしておく
                  （main を二重に出すとランドマークが壊れる）。 */}
              <div
                id="main"
                tabIndex={-1}
                className="min-h-screen w-full overflow-x-hidden focus:outline-none"
              >
                {children}
              </div>
              <footer className="relative z-10 border-t border-[color:var(--color-rule)] py-10 w-full overflow-x-hidden">
                <div
                  className="w-full gutter-x flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-3"
                >
                  <p className="meta">
                    {messages.footer.copyright}
                  </p>
                  <p className="meta">
                    {messages.footer.builtWith}
                  </p>
                </div>
              </footer>
              {/* #contact ハッシュで開く連絡先モーダル（全ページ常駐） */}
              <ContactModal />
            </MotionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
