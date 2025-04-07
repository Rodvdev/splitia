import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Get the user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const { name, image, currency, language } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        externalId: session.user.id
      }
    });
    
    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: {
          id: existingUser.id
        },
        data: {
          name,
          image,
          currency,
          language
        }
      });
      
      return NextResponse.json({ user: updatedUser });
    } else {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          name,
          email: session.user.email || '',
          externalId: session.user.id,
          image,
          currency,
          language
        }
      });
      
      return NextResponse.json({ user: newUser });
    }
  } catch (error) {
    console.error('Error setting up profile:', error);
    return NextResponse.json(
      { error: 'Failed to set up profile' }, 
      { status: 500 }
    );
  }
} 