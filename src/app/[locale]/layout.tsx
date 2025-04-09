import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: { locale: string };
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  // Extract locale from params
  const locale = params.locale;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  let messages;
  try {
    messages = (await import(`@/i18n/locales/${locale}.json`)).default;
  } catch (error: unknown) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    notFound();
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
} 