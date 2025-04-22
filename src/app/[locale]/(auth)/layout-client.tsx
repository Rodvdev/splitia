'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { Providers } from "@/app/providers";

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

// Define font configuration
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type ClientLayoutProps = {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default function AuthClientLayout({
  children,
  params
}: ClientLayoutProps) {
  // Set default locale if not provided
  const locale = (params.locale || 'en') as keyof typeof messages;
  
  return (
    <html lang={locale} suppressHydrationWarning className="dark:bg-slate-950">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white dark:bg-slate-950 dark:text-slate-50 transition-colors`}>
        <Providers locale={locale} messages={messages[locale]}>
          <div className="min-h-screen flex flex-col dark:bg-gray-950">
            {/* Main content - split layout (directly in the screen) */}
            <main className="flex-1 flex flex-col md:flex-row">
              {/* Content will be the actual auth layout content */}
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
} 