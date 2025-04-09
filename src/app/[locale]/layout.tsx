import { locales } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Using a type assertion to bypass the type constraint issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function LocaleLayout(props: any) {
  const { children } = props;
  return children;
} 