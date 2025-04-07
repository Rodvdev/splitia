import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { locales } from "@/i18n/config";

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

// Define supported locales for static generation
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params: { locale = 'en' },
}: Readonly<{
  children: React.ReactNode;
  params: { locale?: string };
}>) {
  // Load messages for the current locale
  const messages = (await import(`@/i18n/messages/${locale}.json`)).default;

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
