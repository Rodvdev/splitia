import { locales } from "@/i18n/config";

// Define supported locales for static generation
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
} 