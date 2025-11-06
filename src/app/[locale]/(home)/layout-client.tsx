'use client';

import { Providers } from "@/app/providers";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { usePathname } from "next/navigation";
import { use } from 'react';

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

type ClientLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

// Use the Next.js provided type instead of defining our own
export default function HomeClientLayout({
  children,
  params
}: ClientLayoutProps) {
  // Unwrap params Promise using React.use()
  const { locale: localeParam } = use(params);
  // Set default locale if not provided
  const locale = (localeParam || 'en') as keyof typeof messages;
  const pathname = usePathname() || '';
  const showHeader = !pathname.includes('/dashboard');
  
  return (
    <Providers locale={locale} messages={messages[locale]}>
      <div className="flex flex-col min-h-screen">
        {showHeader && <Header locale={locale} />}
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </Providers>
  );
}
