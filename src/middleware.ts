import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['ja', 'en', 'zh'],
  defaultLocale: 'ja',
  localePrefix: 'always'
});

export const config = {
  matcher: [
    '/',
    '/(ja|en|zh)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)' 
  ]
};