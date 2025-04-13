'use server';

import { signIn } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';

export const authActions = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      return {
        error: result?.error ? { message: result.error } : null,
        data: result?.error ? null : { user: { email } }
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        error: { message: 'An unexpected error occurred' },
        data: null
      };
    }
  },
  
  // Sign up with name, lastName, email and password
  async signUpWithName(email: string, password: string, name: string, lastName: string) {
    try {
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Create user in database
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          lastName,
        },
      });

      // Sign in the user after successful signup
      return this.signIn(email, password);
    } catch (error) {
      console.error('Sign up with name error:', error);
      return {
        error: { message: 'An unexpected error occurred during sign up' },
        data: null
      };
    }
  }
}; 