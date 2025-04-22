import { locales } from "@/i18n/config";
import ClientLayout from "../(home)/layout-client";
import type { Viewport } from "next";

// Export metadata from external file
export { metadata } from "@/app/metadata";

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

type RootLayoutProps = {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default function RootLayout({
  children,
  params
}: RootLayoutProps) {
  return (
    <ClientLayout params={params}>
      {children}
    </ClientLayout>
  );
} 