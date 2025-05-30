'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { Providers } from "@/app/providers";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { usePathname } from "next/navigation";

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

// Use the Next.js provided type instead of defining our own
export default function HomeClientLayout({
  children,
  params
}: ClientLayoutProps) {
  // Set default locale if not provided
  const locale = (params.locale || 'en') as keyof typeof messages;
  const pathname = usePathname() || '';
  const showHeader = !pathname.includes('/dashboard');
  
  return (
    <html lang={locale} suppressHydrationWarning className="dark:bg-slate-950">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white dark:bg-slate-950 dark:text-slate-50 transition-colors`}>
        <Providers locale={locale} messages={messages[locale]}>
          <div className="flex flex-col min-h-screen">
            {showHeader && <Header locale={locale} />}
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
