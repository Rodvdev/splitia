import React from 'react';
import { useTranslations } from 'next-intl';

// Define static params for prerendering
export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'es' }, { locale: 'pt' }];
}

export default function SettingsPage() {
  // Change from 'Settings' to 'settings' to match the key in the translation file
  const t = useTranslations('settings');
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>
      <p>{t('description')}</p>
      <div className="mt-4 space-y-6">
        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">{t('account')}</h2>
          {/* Account settings will go here */}
        </section>
        
        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">{t('preferences')}</h2>
          {/* Preferences will go here */}
        </section>
        
        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">{t('notifications')}</h2>
          {/* Notification settings will go here */}
        </section>
      </div>
    </div>
  );
} 