import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

// 旧 URL → ホームのアンカーへの誘導。以前は /[locale]/about などの redirect() 専用
// ページ（リクエストごとにサーバー関数を起動）だったが、Vercel のルーター層で
// 完結する静的リダイレクトに移行した。
const SECTION_REDIRECTS = [
  'about',
  'blog',
  'experience',
  'projects',
  'research',
  'skills',
];

const nextConfig: NextConfig = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ['react-icons'],
  },
  redirects: async () =>
    SECTION_REDIRECTS.map((section) => ({
      source: `/:locale(ja|en|zh)/${section}`,
      destination: `/:locale#${section}`,
      permanent: false,
    })),
};

export default withNextIntl(nextConfig);
