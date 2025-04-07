import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { locales } from './i18n/config';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Create a Supabase client configured to use cookies
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  
  // Refresh session if expired & redirect if session doesn't exist
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // Handle internationalization
  // Check if the pathname is missing a locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // Skip internationalization for API routes and Next.js internal routes
  const isApiRoute = pathname.startsWith('/api/');
  const isInternalRoute = pathname.includes('/_next/') || 
                          pathname.includes('/favicon.ico') ||
                          pathname.startsWith('/auth/');
  
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

  // Define paths that don't need authentication
  const publicPaths = [
    '/',
    '/sign-in',
    '/sign-up',
    '/api/auth/callback',
    '/auth/callback',
    '/profile-setup'
  ];

  // Define paths that don't need profile setup
  const noProfileSetupPaths = [
    ...publicPaths,
    '/profile-setup'
  ];

  // Helper to check if path is public
  function isPublicPath(p: string) {
    return publicPaths.some(path => 
      p === path || 
      locales.some(locale => p === `/${locale}${path}`) ||
      p.startsWith('/api/') ||
      p.startsWith('/_next/') ||
      p.includes('/favicon.ico') ||
      p.startsWith('/auth/')
    );
  }

  // Helper to check if path needs profile setup check
  function needsProfileSetup(p: string) {
    return !noProfileSetupPaths.some(path => 
      p === path || 
      locales.some(locale => p === `/${locale}${path}`) ||
      p.startsWith('/api/') ||
      p.startsWith('/_next/') ||
      p.includes('/favicon.ico') ||
      p.startsWith('/auth/')
    );
  }

  // Handle authentication routes
  if (!isPublicPath(pathname)) {
    if (!session) {
      // Redirect to login if accessing dashboard without session
      const redirectUrl = new URL('/sign-in', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Handle profile setup check
  if (session && needsProfileSetup(pathname)) {
    try {
      // Check if profile is complete
      const profileResponse = await fetch(new URL('/api/profile/check', request.url), {
        headers: {
          cookie: request.headers.get('cookie') || '',
          'Content-Type': 'application/json'
        }
      });
      
      if (profileResponse.ok) {
        const { isComplete } = await profileResponse.json();
        
        if (!isComplete) {
          // Redirect to profile setup if profile is not complete
          return NextResponse.redirect(new URL('/profile-setup', request.url));
        }
      }
    } catch (error) {
      console.error('Error checking profile status in middleware:', error);
    }
  }
  
  // Handle public routes when user is already authenticated
  if ((pathname.includes('/sign-in') || pathname.includes('/sign-up')) && session) {
    // Redirect to dashboard if accessing auth pages while logged in
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths, public assets, and API routes
    '/((?!_next/|api/|favicon.ico).*)'
  ],
}; 