'use client';

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';
import { AuthContext } from '@/components/auth/auth-provider';

export function useAuth() {
  const { data: session, status } = useSession();
  const authContext = useContext(AuthContext);
  const router = useRouter();

  // Use both NextAuth and custom auth status
  const isAuthenticated = status === 'authenticated' || authContext.isAuthenticated;
  const isLoading = status === 'loading' || authContext.isLoading;

  const signOut = async () => {
    try {
      // Sign out from NextAuth
      await nextAuthSignOut({ redirect: false });
      
      // Also clear custom cookies
      document.cookie = 'session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'user_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      
      // Also call server action to clear cookies on the server (optional)
      try {
        // This would be even better if you have a server action to clear cookies
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        console.error('Error clearing server cookies:', error);
      }
      
      router.push('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user: session?.user,
    userId: session?.user?.id || authContext.userId,
    isAuthenticated,
    isLoading,
    signOut,
  };
} 