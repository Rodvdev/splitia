'use client';

import { createClient } from '@/lib/supabase/client';

export const authActions = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    const supabase = createClient();
    return supabase.auth.signInWithPassword({ email, password });
  },
  
  // Sign up with email and password
  async signUp(email: string, password: string) {
    const supabase = createClient();
    return supabase.auth.signUp({ 
      email, 
      password, 
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
  },
  
  // Sign out
  async signOut() {
    const supabase = createClient();
    return supabase.auth.signOut();
  }
}; 