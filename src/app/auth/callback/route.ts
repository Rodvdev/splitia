import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code);
    
    // Get user from session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      try {
        // Check if user exists in database
        const user = await prisma.user.findUnique({
          where: {
            externalId: session.user.id
          }
        });

        // If user exists but doesn't have a name, or if user doesn't exist,
        // redirect to profile setup
        if ((user && !user.name) || !user) {
          return NextResponse.redirect(new URL('/profile-setup', requestUrl.origin));
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
      }
    }
  }
  
  // Redirect to dashboard or intended page
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
} 