'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function VerificationPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full space-y-8 bg-card rounded-2xl p-8 shadow-md text-center">
        <div>
          <h1 className="text-3xl font-bold">{t('auth.checkEmail')}</h1>
          <div className="mt-4 text-muted-foreground">
            <p>{t('auth.verificationSent')}</p>
            <p className="mt-2">{t('auth.verificationInstructions')}</p>
          </div>
        </div>
        
        <div className="mt-8 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground">
            {t('auth.noEmailReceived')}
          </p>
          <p className="mt-2 text-sm">
            {t('auth.checkSpam')}
          </p>
        </div>
        
        <div className="pt-4">
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90"
          >
            {t('auth.backToSignIn')}
          </Link>
        </div>
      </div>
    </div>
  );
} 