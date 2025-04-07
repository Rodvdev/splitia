'use client';

import { createContext, useContext, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { AuthError } from '@supabase/supabase-js';

type AuthContextType = {
  signIn: (email: string, password: string) => Promise<{
    error: AuthError | null;
    success: boolean;
  }>;
  signUp: (email: string, password: string, redirectTo?: string) => Promise<{
    error: AuthError | null;
    success: boolean;
  }>;
  signOut: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Sign in with email and password
  async function signIn(email: string, password: string) {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return { error, success: !error };
    } catch (err) {
      console.error('Sign in error:', err);
      return { 
        error: new AuthError('An unexpected error occurred'),
        success: false 
      };
    } finally {
      setIsLoading(false);
    }
  }

  // Sign up with email and password
  async function signUp(email: string, password: string, redirectTo?: string) {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        },
      });
      
      return { error, success: !error };
    } catch (err) {
      console.error('Sign up error:', err);
      return { 
        error: new AuthError('An unexpected error occurred'),
        success: false 
      };
    } finally {
      setIsLoading(false);
    }
  }

  // Sign out
  async function signOut() {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signUp,
        signOut,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 