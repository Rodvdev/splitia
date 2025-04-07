import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Create Supabase client with the correct way to use cookies
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Get the user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Log for debugging
    console.log('Checking profile for user:', session.user.email, 'with Supabase ID:', session.user.id);
    
    // Try to find user by externalId first
    let user = await prisma.user.findUnique({
      where: {
        externalId: session.user.id
      },
      select: {
        id: true,
        name: true,
        externalId: true,
        email: true
      }
    });
    
    // If not found by externalId, try by email
    if (!user && session.user.email) {
      user = await prisma.user.findUnique({
        where: {
          email: session.user.email
        },
        select: {
          id: true,
          name: true,
          externalId: true,
          email: true
        }
      });
      
      // If found by email but no externalId, update with externalId
      if (user && !user.externalId) {
        console.log('Found user by email, updating with externalId');
        user = await prisma.user.update({
          where: { id: user.id },
          data: { externalId: session.user.id },
          select: {
            id: true,
            name: true,
            externalId: true,
            email: true
          }
        });
      }
    }
    
    // If user still not found, create a minimal record
    if (!user) {
      console.log('Creating minimal user record for authenticated user');
      user = await prisma.user.create({
        data: {
          name: session.user.email?.split('@')[0] || 'New User',
          email: session.user.email || '',
          externalId: session.user.id
        },
        select: {
          id: true,
          name: true,
          externalId: true,
          email: true
        }
      });
      console.log('Created new user with ID:', user.id);
    }
    
    // Check if profile is complete (has a name)
    const isComplete = Boolean(user.name);
    
    return NextResponse.json({ 
      isComplete,
      user: {
        id: user.id,
        externalId: user.externalId,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error checking profile status:', error);
    return NextResponse.json(
      { error: 'Failed to check profile status' }, 
      { status: 500 }
    );
  }
} 