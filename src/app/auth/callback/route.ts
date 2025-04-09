import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions);
    
    if (session?.user) {
      // Check if user exists in database and has completed profile
      const user = await prisma.user.findUnique({
        where: {
          id: session.user.id
        }
      });
      
      // If user exists but doesn't have a name, redirect to profile setup
      if (user && !user.name) {
        return NextResponse.redirect(new URL('/profile-setup', requestUrl.origin));
      }
    }
  } catch (error) {
    console.error('Error in auth callback:', error);
  }
  
  // Redirect to dashboard or intended page
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
} 