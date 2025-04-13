import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/config.ts');

const nextConfig: NextConfig = {
  /* config options here */
  swcMinify: true,
  output: 'standalone',
  experimental: {
    // Deshabilitamos temporalmente la optimización que causa problemas en Vercel
    optimizeCss: false
  }
};

export default withNextIntl(nextConfig);
