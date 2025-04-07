// This file is server-only and should not be imported by client components
// https://nextjs.org/docs/app/building-your-application/rendering/server-components
'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from './client';

/**
 * Creates a Supabase client for use in server components
 * IMPORTANT: This can only be used in Server Components
 */
export function createServerClient() {
  return createServerComponentClient<Database>({ cookies });
}

// Server-only auth actions - DO NOT import in client components
export const serverAuthActions = {
  // Get current user session
  async getSession() {
    const supabase = createServerClient();
    return supabase.auth.getSession();
  },
};

/**
 * Server actions for auth
 */
export const authActions = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    const supabase = await createServerClient();
    return supabase.auth.signInWithPassword({ email, password });
  },
  
  // Sign up with email and password
  async signUp(email: string, password: string) {
    const supabase = await createServerClient();
    return supabase.auth.signUp({ email, password });
  },
  
  // Sign out
  async signOut() {
    const supabase = await createServerClient();
    return supabase.auth.signOut();
  }
}; 