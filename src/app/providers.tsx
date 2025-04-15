'use client';

import { ReactNode, useEffect, useState } from 'react';
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
  // Get saved theme from localStorage if available
  const [theme, setTheme] = useState('dark'); // Default to dark

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      // Convert from ThemeMode enum to next-themes format
      if (savedTheme === 'DARK') setTheme('dark');
      else if (savedTheme === 'LIGHT') setTheme('light');
      else setTheme('dark'); // Default to dark instead of system
    }
  }, []);

  return (
    <NextIntlClientProvider 
      locale={locale} 
      messages={messages}
      timeZone="UTC"
    >
      <ThemeProvider
        attribute="class"
        defaultTheme={theme}
        enableSystem={false} // Disable system theme
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