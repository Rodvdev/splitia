import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import type { IntlConfig } from 'next-intl';

// List of supported locales
export const locales = ['en', 'es', 'pt'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale = 'en' as Locale;
export const localePrefix = 'as-needed' as const;

// Helper function to check if a locale is supported
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Configuration for next-intl
export default getRequestConfig(async ({ locale }) => {
  const currentLocale = locale || defaultLocale;
  
  // Validate that the locale is supported
  if (!isValidLocale(currentLocale)) {
    notFound();
  }

  // Import the locale messages
  const messages = (await import(`./messages/${currentLocale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: 'UTC',
    now: new Date(),
  } as IntlConfig;
}); 