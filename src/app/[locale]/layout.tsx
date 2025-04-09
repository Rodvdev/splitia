import { locales } from '@/i18n/config';
import { NextIntlClientProvider } from 'next-intl';
import LocaleClientLayout from '@/components/locale/locale-client-layout';

// Import language messages
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
import pt from '@/i18n/locales/pt.json';

// Define messages by locale
const messages = {
  en,
  es,
  pt
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Set the locale from the URL param
  const { locale } = params;
  
  return (
    <NextIntlClientProvider 
      locale={locale} 
      messages={messages[locale as keyof typeof messages]}
      timeZone="UTC"
    >
      <LocaleClientLayout params={params}>
        {children}
      </LocaleClientLayout>
    </NextIntlClientProvider>
  );
} 