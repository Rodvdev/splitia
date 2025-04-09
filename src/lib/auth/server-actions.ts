'use server';

import { prisma } from '@/lib/prisma';
import { hashPassword, comparePasswords } from '@/lib/auth/password';
import { cookies } from 'next/headers';
// Remove the import of client-side functions
// import { signIn, signOut } from 'next-auth/react';
import type { User } from '.prisma/client';

// Type definitions
type CustomAuthError = {
  message: string;
};

type AuthResult = {
  user: Partial<User> | null;
  error: CustomAuthError | null;
};

// Custom type to include password
type UserWithPassword = User & {
  password?: string;
};

// Cookie store type
type CookieStore = {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options: CookieOptions) => void;
  delete: (name: string) => void;
};

type CookieOptions = {
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  secure?: boolean;
};

// Create a new user
export async function createUser(
  email: string, 
  password: string, 
  name: string,
  currency: string = 'PEN',
  language: string = 'es'
): Promise<AuthResult> {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return { 
        user: null, 
        error: { message: 'User with this email already exists' } 
      };
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user with password field added using type assertion
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
        updatedAt: new Date(),
        currency,
        language
      }
    });
    
    // Remove the client-side sign in
    // try {
    //   // Sign in the user with NextAuth (client-side action called from server)
    //   await signIn('credentials', {
    //     redirect: false,
    //     email,
    //     password,
    //   });
    // } catch (signInError) {
    //   console.error('NextAuth sign in error:', signInError);
    // }
    
    // Create a session cookie as a backup mechanism
    createSessionCookie(user.id);
    
    return { user, error: null };
  } catch (error) {
    console.error('Error creating user:', error);
    return { 
      user: null, 
      error: { message: 'Could not create user' } 
    };
  }
}

// Sign in a user
export async function signInUser(
  email: string, 
  password: string
): Promise<AuthResult> {
  try {
    // Find user by email with type assertion
    const user = await prisma.user.findUnique({
      where: { email },
    }) as UserWithPassword;
    
    if (!user || !user.password) {
      return { 
        user: null, 
        error: { message: 'Invalid email or password' } 
      };
    }
    
    // Compare password
    const passwordMatch = await comparePasswords(password, user.password);
    
    if (!passwordMatch) {
      return { 
        user: null, 
        error: { message: 'Invalid email or password' } 
      };
    }
    
    // Remove client-side signIn call
    // try {
    //   // Sign in the user with NextAuth
    //   await signIn('credentials', {
    //     redirect: false,
    //     email,
    //     password,
    //   });
    // } catch (signInError) {
    //   console.error('NextAuth sign in error:', signInError);
    //   // Continue with the fallback mechanism if NextAuth fails
    // }
    
    // Create a session cookie as the main mechanism
    createSessionCookie(user.id);
    
    return { 
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return { 
      user: null, 
      error: { message: 'An unexpected error occurred' } 
    };
  }
}

// Get current user
export async function getCurrentUser(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return { 
        user: null, 
        error: { message: 'Not authenticated' } 
      };
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true
      }
    });
    
    if (!user) {
      // Clear cookies if user no longer exists
      const cookieStore = cookies() as unknown as CookieStore;
      cookieStore.delete('session_id');
      cookieStore.delete('user_id');
      
      return { 
        user: null, 
        error: { message: 'User not found' } 
      };
    }
    
    return { user, error: null };
  } catch (error) {
    console.error('Get user error:', error);
    return { 
      user: null, 
      error: { message: 'An unexpected error occurred' } 
    };
  }
}

// Sign out
export async function signOutUser(): Promise<{ success: boolean }> {
  try {
    // Remove the NextAuth signOut call
    // await signOut({ redirect: false });
    
    // Clear custom cookies
    const cookieStore = await cookies();
    cookieStore.delete('session_id');
    cookieStore.delete('user_id');
    
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false };
  }
}

// Create a session cookie
async function createSessionCookie(userId: string): Promise<void> {
  const sessionId = crypto.randomUUID();
  const cookieStore = await cookies();
  
  // Set secure flag based on environment
  const isSecure = process.env.NODE_ENV === 'production';
  
  cookieStore.set('session_id', sessionId, { 
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
    secure: isSecure,
  });
  
  cookieStore.set('user_id', userId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
    secure: isSecure,
  });
} 