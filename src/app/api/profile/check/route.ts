import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Get the user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: {
        externalId: session.user.id
      },
      select: {
        id: true,
        name: true,
        externalId: true
      }
    });
    
    // Check if profile is complete
    const isComplete = Boolean(user && user.name);
    
    return NextResponse.json({ isComplete });
  } catch (error) {
    console.error('Error checking profile status:', error);
    return NextResponse.json(
      { error: 'Failed to check profile status' }, 
      { status: 500 }
    );
  }
} 