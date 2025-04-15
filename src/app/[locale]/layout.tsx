import { locales } from "@/i18n/config";
import ClientLayout from "./layout-client";

// Export metadata from external file
export { metadata } from "@/app/metadata";

// Define supported locales for static generation
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type RootLayoutProps = {
  children: React.ReactNode;
  params: { locale: string };
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