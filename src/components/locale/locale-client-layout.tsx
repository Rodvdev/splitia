'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useProfile } from '@/hooks/use-profile';
import { useAuth } from '@/components/auth/auth-provider';

export default function LocaleClientLayout(props: { 
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { children, params } = props;
  const { locale } = params;
  const { profile, isLoading } = useProfile();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to user's preferred locale if authenticated and profile has a different language setting
  useEffect(() => {
    if (isAuthenticated && !isLoading && profile?.language && profile.language !== locale && pathname) {
      // Get the current path without the locale prefix
      const pathWithoutLocale = pathname.replace(`/${locale}`, '');
      
      // Avoid double prefixing - check if pathWithoutLocale already includes the locale
      if (pathWithoutLocale.startsWith(`/${profile.language}`)) {
        // Already has the locale, don't add it again
        router.replace(pathWithoutLocale);
        router.refresh();
      } else {
        // Add the locale if needed
        const newPath = `/${profile.language}${pathWithoutLocale}`;
        router.replace(newPath);
        router.refresh();
      }
    }
  }, [isAuthenticated, isLoading, profile, locale, pathname, router]);

  return children;
} 