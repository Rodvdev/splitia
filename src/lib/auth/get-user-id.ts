import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

// Define type for cookie store
interface CookieStore {
  get: (name: string) => { value: string } | undefined;
}

/**
 * Utility function to get the user ID from NextAuth session or custom cookies
 * Handles type issues with the cookies() API
 */
export async function getUserId(): Promise<string | null> {
  try {
    // Try to get the user from NextAuth session
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      return session.user.id;
    }

    // Fall back to custom cookie
    try {
      // Cast to our interface to handle type issues
      const cookieStore = cookies() as unknown as CookieStore;
      const userId = cookieStore.get('user_id')?.value;
      
      return userId || null;
    } catch (cookieError) {
      console.error('Error accessing cookies:', cookieError);
      return null;
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
} 