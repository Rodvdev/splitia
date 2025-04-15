'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/components/auth/auth-provider';
import { NextIntlClientProvider } from 'next-intl';
import { UserPreferencesProvider } from '@/components/user/user-preferences-provider';
import { ThemeProvider } from 'next-themes';

type ProvidersProps = {
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
};

export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider 
      locale={locale} 
      messages={messages}
      timeZone="UTC"
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
      >
        <AuthProvider>
          <UserPreferencesProvider>
            {children}
          </UserPreferencesProvider>
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
} 