import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && ['ja', 'en', 'zh'].includes(requested) ? requested : 'ja';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});