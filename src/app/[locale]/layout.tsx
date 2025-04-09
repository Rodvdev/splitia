import { locales } from '@/i18n/config';
import { NextIntlClientProvider } from 'next-intl';
import LocaleClientLayout from '@/components/locale/locale-client-layout';
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
import pt from '@/i18n/locales/pt.json';

const messages = { en, es, pt };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = params.locale as keyof typeof messages;

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages[locale]}
      timeZone="UTC"
    >
      <LocaleClientLayout params={params}>
        {children}
      </LocaleClientLayout>
    </NextIntlClientProvider>
  );
}