import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_JP } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import Navigation from "@/components/Navigation";
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
          url: "https://ryosh.in/logo.png",
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
    <html
      lang={validLocale}
      className={`${inter.variable} ${jetbrainsMono.variable} ${notoSansJP.variable}`}
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
              <Navigation />
              <main className="min-h-screen w-full overflow-x-hidden">
                {children}
              </main>
              <footer className="relative z-10 border-t border-[color:var(--color-rule)] py-10 w-full overflow-x-hidden">
                <div
                  className="w-full gutter-x flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-3"
                >
                  <p className="meta">
                    {messages.footer.copyright}
                  </p>
                  <p className="meta opacity-70">
                    {messages.footer.builtWith}
                  </p>
                </div>
              </footer>
            </MotionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
