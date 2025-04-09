import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  // Clear the cookies using the cookies API
  const cookieStore = await cookies();
  cookieStore.delete('session_id');
  cookieStore.delete('user_id');
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('next-auth.callback-url');
  cookieStore.delete('next-auth.csrf-token');
  
  // Return success response
  return NextResponse.json({ success: true });
} 