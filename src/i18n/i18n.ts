// Import and re-export from the config file in src/i18n
import { locales, defaultLocale, isValidLocale } from './config';
import type { Locale } from './config';

// Re-export values
export { locales, defaultLocale, isValidLocale };
// Re-export types
export type { Locale };

// Re-export the default export (getRequestConfig) from src/i18n/config
export { default } from './config';