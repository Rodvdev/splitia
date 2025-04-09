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

export default function LocaleLayout(props: { 
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = props.params;
  
  // Ensure we're using a valid locale or default to 'en'
  const currentLocale = (locale && locale in messages) ? locale : 'en';
  
  return (
    <NextIntlClientProvider locale={currentLocale} messages={messages[currentLocale as keyof typeof messages]} timeZone="UTC">
      <LocaleClientLayout {...props}>
        {props.children}
      </LocaleClientLayout>
    </NextIntlClientProvider>
  );
} 