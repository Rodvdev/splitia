'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useProfile } from '@/hooks/use-profile';

export default function SettingsPage() {
  const t = useTranslations();
  const { profile, isLoading, updateProfile } = useProfile();
  
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('PEN');
  const [language, setLanguage] = useState('es');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Currencies and languages options
  const currencies = [
    { value: 'PEN', label: 'Sol Peruano (S/)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'MXN', label: 'Peso Mexicano ($)' },
    { value: 'COP', label: 'Peso Colombiano ($)' },
    { value: 'ARS', label: 'Peso Argentino ($)' },
  ];

  const languages = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
  ];

  // Load user data when profile is loaded
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setCurrency(profile.currency || 'PEN');
      setLanguage(profile.language || 'es');
    }
  }, [profile]);

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const success = await updateProfile({
        name,
        currency,
        language,
      });

      if (success) {
        setSuccessMessage(t('settings.profileUpdated'));
        
        // If language changed, reload the page with new locale after a short delay
        if (profile && profile.language !== language) {
          setTimeout(() => {
            // Force a full page reload with the new locale
            window.location.href = `/${language}/dashboard/settings`;
          }, 1500);
        }
      } else {
        setErrorMessage(t('settings.updateError'));
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMessage(t('settings.updateError'));
    } finally {
      setIsSaving(false);
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('settings.description')}
        </p>
      </header>

      {errorMessage && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="bg-success/10 text-success p-4 rounded-lg mb-6">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-card text-card-foreground rounded-2xl shadow-md p-8">
            <h2 className="text-xl font-semibold mb-6">
              {t('settings.profileSettings')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-1"
                >
                  {t('settings.name')}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                  placeholder={t('settings.namePlaceholder')}
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1"
                >
                  {t('settings.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  readOnly
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-muted"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('settings.emailReadOnly')}
                </p>
              </div>

              {/* Language Selection */}
              <div>
                <label
                  htmlFor="language"
                  className="block text-sm font-medium mb-1"
                >
                  {t('settings.language')}
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('settings.languageHelp')}
                </p>
              </div>

              {/* Currency Selection */}
              <div>
                <label
                  htmlFor="currency"
                  className="block text-sm font-medium mb-1"
                >
                  {t('settings.currency')}
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                >
                  {currencies.map((curr) => (
                    <option key={curr.value} value={curr.value}>
                      {curr.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('settings.currencyHelp')}
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? t('common.saving') : t('settings.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div>
          <div className="bg-card text-card-foreground rounded-2xl shadow-md p-8">
            <h2 className="text-xl font-semibold mb-6">
              {t('settings.accountInfo')}
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t('settings.accountId')}
                </h3>
                <p className="text-sm font-mono mt-1">{profile?.id}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t('settings.createdAt')}
                </h3>
                <p className="text-sm mt-1">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t('settings.lastUpdated')}
                </h3>
                <p className="text-sm mt-1">
                  {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 