import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { locales } from "@/i18n/config";

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

export const metadata: Metadata = {
  title: "Splitia - Expense Splitting Made Easy",
  description: "A simple expense splitting application for groups with internationalization and multi-currency support",
  keywords: ["expense tracker", "bill splitting", "group expenses", "finance app"],
  authors: [{ name: "Splitia Team" }],
};

// Define viewport configuration
export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

// Define supported locales for static generation
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Use the Next.js provided type instead of defining our own
export default function RootLayout({
  children,
  params = {}
}: {
  children: React.ReactNode;
  params?: { locale?: string };
}) {
  // Set default locale if not provided
  const locale = (params.locale || 'en') as keyof typeof messages;
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers locale={locale} messages={messages[locale]}>
          {children}
        </Providers>
      </body>
    </html>
  );
} 