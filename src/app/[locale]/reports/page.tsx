import React from 'react';
import { useTranslations } from 'next-intl';

// Mark page as static to be pre-rendered at build time
export const dynamic = 'force-static';

// This is needed for proper static generation with next-intl
export function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'es' },
    { locale: 'pt' }
  ];
}

export default function ReportsPage() {
  const t = useTranslations('Reports');
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>
      <p>{t('description')}</p>
      <div className="mt-4">
        {/* Reports content will go here */}
      </div>
    </div>
  );
} 