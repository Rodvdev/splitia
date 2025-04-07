import React from 'react';
import { useTranslations } from 'next-intl';

// Mark page as static to be pre-rendered at build time
export const dynamic = 'force-static';

export default function CategoriesPage() {
  const t = useTranslations('Categories');
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>
      <p>{t('description')}</p>
      <div className="mt-4">
        {/* Categories content will go here */}
      </div>
    </div>
  );
} 