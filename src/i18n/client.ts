'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { defaultLocale } from './config';

/**
 * Custom hook for accessing locale information and translations in client components
 * 
 * @returns {Object} Locale information and translation function
 */
export function useLocale() {
  // Get the locale from URL params
  const params = useParams();
  const locale = params?.locale as string || defaultLocale;
  
  // Get the translation function
  const t = useTranslations();
  
  return {
    locale,
    t,
  };
} 