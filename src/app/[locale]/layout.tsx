import { locales } from '@/i18n/config';
import LocaleClientLayout from '@/components/locale/locale-client-layout';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function LocaleLayout(props: { 
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <LocaleClientLayout {...props}>
      {props.children}
    </LocaleClientLayout>
  );
} 