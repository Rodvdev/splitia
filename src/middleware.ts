import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale, Locale } from './i18n/config';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for assets, API routes and Next.js internals
  if (
    pathname.includes('/_next/') || 
    pathname.includes('/api/') ||
    pathname.includes('/favicon.ico')
  ) {
    return NextResponse.next();
  }
  
  // Check if the pathname already has a locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // If the pathname doesn't have a locale, redirect to the appropriate locale
  if (!pathnameHasLocale) {
    let locale = defaultLocale;
    
    // Try to get the preferred locale from Accept-Language header
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
      // Parse the Accept-Language header to get language preferences
      const userLanguages = acceptLanguage.split(',')
        .map(lang => {
          const [language, quality = '1'] = lang.trim().split(';q=');
          return {
            language: language.split('-')[0].toLowerCase(), // Get just the language code
            quality: parseFloat(quality)
          };
        })
        .sort((a, b) => b.quality - a.quality); // Sort by quality (highest first)
      
      // Find the first preferred language that we support
      for (const { language } of userLanguages) {
        // Check if the language is one of our supported locales
        if (locales.includes(language as Locale)) {
          locale = language as Locale;
          break;
        }
      }
    }
    
    // Create new URL with locale prefix
    const newUrl = new URL(
      `/${locale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`,
      request.url
    );
    
    // Copy the search params
    newUrl.search = request.nextUrl.search;
    
    // Redirect to the new URL
    return NextResponse.redirect(newUrl);
  }
  
  // Continue with the request if it already has a locale
  return NextResponse.next();
}

export const config = {
  // Apply middleware only to pages that should be internationalized
  matcher: ['/((?!api|_next|favicon.ico|.*\\..*).*)']
}; 