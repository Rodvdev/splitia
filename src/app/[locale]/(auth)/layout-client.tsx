'use client';

import { Providers } from "@/app/providers";
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

export default function AuthClientLayout({
  children,
  params
}: ClientLayoutProps) {
  // Unwrap params Promise using React.use()
  const { locale: localeParam } = use(params);
  // Set default locale if not provided
  const locale = (localeParam || 'en') as keyof typeof messages;
  
  return (
    <Providers locale={locale} messages={messages[locale]}>
      <div className="min-h-screen flex flex-col dark:bg-gray-950">
        {/* Main content - split layout (directly in the screen) */}
        <main className="flex-1 flex flex-col md:flex-row">
          {/* Content will be the actual auth layout content */}
          {children}
        </main>
      </div>
    </Providers>
  );
} 