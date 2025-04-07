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

  // Add auth token to response headers for GraphQL requests
  if (session && pathname === '/api/graphql') {
    // Clone the headers to avoid immutability issues
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Authorization', `Bearer ${session.access_token}`);
    
    // Create a new response with the updated headers
    const newResponse = new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
    
    console.log('Added Authorization header to GraphQL request');
    return newResponse;
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

  // Handle authentication routes
  if (!isPublicPath(pathname)) {
    if (!session) {
      // Redirect to login if accessing dashboard without session
      const redirectUrl = new URL('/sign-in', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Check profile status for authenticated users on protected routes
  if (session && !isApiRoute && needsProfileSetup(pathname)) {
    try {
      // Set up common request headers
      const headers = {
        cookie: request.headers.get('cookie') || '',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      };

      // Create a controller to handle timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      // Make a single fetch request to check profile status
      const profileResponse = await fetch(new URL('/api/profile/check', request.url), {
        headers,
        signal: controller.signal
      }).catch(error => {
        console.error('Error in profile check:', error);
        return null;
      });
      
      clearTimeout(timeoutId);
      
      if (profileResponse && profileResponse.ok) {
        const profileData = await profileResponse.json();
        
        if (!profileData.isComplete) {
          // Get the locale from the current path if it exists
          const localeMatch = pathname.match(new RegExp(`^/(${locales.join('|')})/`));
          const locale = localeMatch ? localeMatch[1] : 'en';
          
          // Redirect to profile setup if profile is not complete
          const setupUrl = new URL(`/${locale}/profile-setup`, request.url);
          return NextResponse.redirect(setupUrl);
        }
      }
    } catch (error) {
      console.error('Error checking profile status in middleware:', error);
      // Continue without blocking the request on error
    }
  }
  
  // Handle public routes when user is already authenticated
  if ((pathname.includes('/sign-in') || pathname.includes('/sign-up')) && session) {
    // Get the locale from the current path if it exists
    const localeMatch = pathname.match(new RegExp(`^/(${locales.join('|')})/`));
    const locale = localeMatch ? localeMatch[1] : 'en';
    
    // Redirect to dashboard if accessing auth pages while logged in
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    // Skip static files and images
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 