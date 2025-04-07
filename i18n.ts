import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, Locale } from './src/i18n/config';

// Re-export locales from the config file
export { locales, defaultLocale };

export default getRequestConfig(async ({ locale }) => {
  // Validate that the locale is supported
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Import the locale messages
  const messages = (await import(`./src/i18n/messages/${locale}.json`)).default;

  return {
    locale: locale as string, // Explicitly type as string to satisfy TypeScript
    messages,
    timeZone: 'UTC',
    now: new Date(),
  };
}); 