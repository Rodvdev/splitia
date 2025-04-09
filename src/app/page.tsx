'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { locales, defaultLocale } from '@/i18n/config';
      

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Function to detect user's preferred language
    const detectUserLanguage = () => {
      // Check browser's language preference
      const browserLang = navigator.language.split('-')[0];
      
      // See if browser language is in our supported locales
      const supportedLang = locales.includes(browserLang as (typeof locales)[number]) 
        ? browserLang 
        : defaultLocale;
        
      return supportedLang;
    };

    // Redirect to the user's preferred language
    const preferredLanguage = detectUserLanguage();
    router.replace(`/${preferredLanguage}/dashboard`);
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-bold">Splitia</h1>
        </div>
        <p className="text-xl text-center sm:text-left">
          Simple expense splitting for groups
        </p>
        <div className="animate-pulse flex justify-center w-full">
          <div className="h-4 w-48 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <span className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Splitia
        </span>
      </footer>
    </div>
  );
}
