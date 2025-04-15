import { locales } from "@/i18n/config";
import ClientLayout from "./layout-client";

// Export metadata from external file
export { metadata } from "@/app/metadata";

// Define supported locales for static generation
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function RootLayout({
  children,
  params = {}
}: {
  children: React.ReactNode;
  params?: { locale?: string };
}) {
  return (
    <ClientLayout params={params}>
      {children}
    </ClientLayout>
  );
} 