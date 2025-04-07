import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/i18n/config';
import { NextRequest, NextResponse } from 'next/server';

// Create the internationalization middleware
export const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales,
  // Used when no locale matches
  defaultLocale,
  // Define where the locale will appear in the URL
  localePrefix: 'as-needed',
});

// Define paths that don't need authentication
const publicPaths = [
  '/',
  '/sign-in',
  '/sign-up',
  '/api/auth/callback',
];

// Helper to check if path is public
function isPublicPath(pathname: string) {
  return publicPaths.some(path => 
    pathname === path || 
    locales.some(locale => pathname === `/${locale}${path}`)
  );
}

// Export the middleware
export async function middleware(request: NextRequest) {
  // Apply internationalization middleware first
  const response = intlMiddleware(request);
  
  // Check if the path is public
  if (isPublicPath(request.nextUrl.pathname)) {
    return response;
  }

  // Get the Supabase auth cookie
  const supabaseAuthCookie = request.cookies.get('sb-auth-token')?.value;
  
  // If no auth cookie, redirect to sign-in
  if (!supabaseAuthCookie) {
    const redirectUrl = new URL('/sign-in', request.url);
    
    // Add original pathname as a query parameter for redirecting back after sign-in
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

// Configure middleware matcher for Next.js
export const config = {
  // Match all paths except for assets, api routes that don't need auth, and other static files
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}; 