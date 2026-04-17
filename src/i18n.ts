import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  // Validate and default locale
  const validLocale = locale && ['ja', 'en', 'zh'].includes(locale) ? locale : 'ja';
  
  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default
  };
});