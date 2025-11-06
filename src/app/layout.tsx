import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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
}: {
  children: React.ReactNode;
}) {
  // Root layout doesn't receive locale params - nested layouts handle locale-specific providers
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white dark:bg-slate-950 dark:text-slate-50 transition-colors`}>
        {children}
      </body>
    </html>
  );
} 