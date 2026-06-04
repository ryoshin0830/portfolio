import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';

const locales = ['ja', 'en', 'zh'] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl v4: resolve the locale from the request (a Promise), then validate
  const requested = await requestLocale;
  const locale = hasLocale(locales, requested) ? requested : 'ja';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});