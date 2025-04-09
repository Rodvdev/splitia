import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: ReactNode;
  params: {
    locale: string;
  };
}

export default function LocaleLayout(props: LocaleLayoutProps) {
  const { children, params } = props;
  const locale = params.locale;
  
  // Validate that the incoming locale param is a valid locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return children;
} 