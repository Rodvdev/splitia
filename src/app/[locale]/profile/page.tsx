import React from 'react';
import { useTranslations } from 'next-intl';

export default function ProfilePage() {
  const t = useTranslations('Profile');
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>
      <p>{t('description')}</p>
      <div className="mt-4">
        {/* Profile content will go here */}
      </div>
    </div>
  );
} 