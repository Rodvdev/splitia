import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales } from './i18n/config';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Create a response without integration
  const response = NextResponse.next();
  
  // Handle internationalization
  // Check if the pathname is missing a locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // Skip internationalization for API routes and Next.js internal routes
  const isApiRoute = pathname.startsWith('/api/');
  const isInternalRoute = pathname.includes('/_next/') || 
                          pathname.includes('/favicon.ico');
  
  if (!pathnameHasLocale && !isApiRoute && !isInternalRoute) {
    // Get the preferred locale from the Accept-Language header
    const acceptLanguage = request.headers.get('accept-language') || '';
    const userLocale = acceptLanguage.split(',')[0].split('-')[0] || 'en';
    
    // Use the user's preferred locale if it's supported, otherwise default to 'en'
    const locale = locales.includes(userLocale as typeof locales[number]) ? userLocale : 'en';
    
    // Redirect to the same URL but with the locale prefix
    const newUrl = new URL(`/${locale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`, request.url);
    newUrl.search = request.nextUrl.search;
    return NextResponse.redirect(newUrl);
  }
  
  return response;
}

export const config = {
  matcher: [
    // Skip static files and images
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 