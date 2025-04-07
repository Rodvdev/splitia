import React from 'react';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

// Mark explicitly as a server component
export const dynamic = 'force-static';

export async function generateMetadata({ 
  params 
}: { 
  params: { locale: string } 
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'Categories' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

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