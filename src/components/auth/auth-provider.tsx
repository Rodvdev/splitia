'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode, useEffect, createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';

type AuthProviderProps = {
  children: ReactNode;
};

// Custom auth context to manage both NextAuth and custom cookies
type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
};

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userId: null,
});

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Internal component that checks authentication
function AuthStateManager({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // Check custom auth on mount
  useEffect(() => {
    async function checkCustomCookies() {
      try {
        // Check for the custom cookie (client-side)
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        const customUserId = cookies['user_id'];
        
        if (customUserId) {
          setUserId(customUserId);
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Error checking custom auth:', error);
        return false;
      }
    }

    async function validateAuth() {
      // First check NextAuth session
      if (session?.user) {
        setUserId(session.user.id);
        setIsLoading(false);
        return;
      }
      
      // Then check custom cookies
      const hasCustomAuth = await checkCustomCookies();
      if (hasCustomAuth) {
        setIsLoading(false);
        return;
      }
      
      // If neither authentication method worked and we're done loading
      if (status !== 'loading') {
        setIsLoading(false);
        
        // Optional: redirect to login
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/sign-in') && 
            !currentPath.includes('/sign-up') && 
            !currentPath.includes('/forgot-password')) {
          router.push('/sign-in');
        }
      }
    }

    validateAuth();
  }, [session, status, router]);

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated: !!userId, 
        isLoading, 
        userId 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <AuthStateManager>{children}</AuthStateManager>
    </SessionProvider>
  );
} 