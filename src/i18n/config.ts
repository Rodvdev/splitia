import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

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
  // Always ensure we have a locale, defaulting to 'en' if not provided
  const currentLocale = locale || defaultLocale;
  
  // Validate that the locale is supported
  if (!isValidLocale(currentLocale)) {
    notFound();
  }

  try {
    // Import the locale messages
    const messages = (await import(`./locales/${currentLocale}.json`)).default;

    return {
      locale: currentLocale,
      messages,
      timeZone: 'UTC',
      now: new Date(),
    };
  } catch (error) {
    console.error(`Failed to load messages for locale: ${currentLocale}`, error);
    
    // Still return a valid config with the locale even if messages fail to load
    return {
      locale: currentLocale,
      messages: {},
      timeZone: 'UTC',
      now: new Date(),
    };
  }
}); 