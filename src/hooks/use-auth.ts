'use client';

import { useSession } from 'next-auth/react';
import { useContext } from 'react';
import { AuthContext } from '@/components/auth/auth-provider';

export function useAuth() {
  const { data: session, status } = useSession();
  const authContext = useContext(AuthContext);

  // Use both NextAuth and custom auth status
  const isAuthenticated = status === 'authenticated' || authContext.isAuthenticated;
  const isLoading = status === 'loading' || authContext.isLoading;



  return {
    user: session?.user,
    userId: session?.user?.id || authContext.userId,
    isAuthenticated,
    isLoading,
    isSigningOut: authContext.isSigningOut,
  };
} 