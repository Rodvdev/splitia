'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/components/auth/auth-provider';
import { NextIntlClientProvider } from 'next-intl';

type ProvidersProps = {
  children: ReactNode;
  locale: string;
  messages: Record<string, Record<string, unknown>>;
};

export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider 
      locale={locale} 
      messages={messages}
      timeZone="UTC"
    >
      <AuthProvider>{children}</AuthProvider>
    </NextIntlClientProvider>
  );
} 