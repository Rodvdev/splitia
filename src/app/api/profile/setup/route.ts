import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // Get the user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Log the Supabase user ID for debugging
    console.log('Setting up profile for Supabase user ID:', session.user.id);
    
    // Parse the request body
    const { name, image, currency, language } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    // Check if user already exists by externalId
    let existingUser = await prisma.user.findUnique({
      where: {
        externalId: session.user.id
      }
    });
    
    // If no user found by externalId, check by email
    if (!existingUser && session.user.email) {
      existingUser = await prisma.user.findUnique({
        where: {
          email: session.user.email
        }
      });
      
      // If found by email but no externalId, update with externalId
      if (existingUser && !existingUser.externalId) {
        console.log('Found user by email, updating with externalId');
        existingUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: { externalId: session.user.id }
        });
      }
    }
    
    if (existingUser) {
      // Update existing user
      console.log('Updating existing user with ID:', existingUser.id);
      const updatedUser = await prisma.user.update({
        where: {
          id: existingUser.id
        },
        data: {
          name,
          image,
          currency,
          language,
          externalId: session.user.id // Ensure externalId is always set
        }
      });
      
      return NextResponse.json({ user: updatedUser });
    } else {
      // Create new user
      console.log('Creating new user for Supabase account');
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
      
      console.log('Created new user with ID:', newUser.id);
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