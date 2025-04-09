import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { comparePasswords } from '@/lib/auth/password';
import { prisma } from '@/lib/prisma';
import type { DefaultSession } from 'next-auth';

// Extend the session user type to include id
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
    accessToken?: string;
  }
  
  interface JWT {
    id?: string;
    accessToken?: string;
  }
}

// User type with password
type UserWithPassword = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  password?: string;  // Make password optional
  [key: string]: unknown;
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find the user with the email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }
        
        // Cast to unknown first, then to UserWithPassword (safer type assertion)
        const userWithPassword = user as unknown as UserWithPassword;
        
        if (!userWithPassword.password) {
          return null;
        }

        const passwordMatch = await comparePasswords(
          credentials.password,
          userWithPassword.password
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Generate a simple token using user ID and timestamp
        token.accessToken = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  // Configure secure cookies for better session handling
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  // Add CSRF protection
  secret: process.env.NEXTAUTH_SECRET || 'YOUR_FALLBACK_SECRET_DO_NOT_USE_IN_PRODUCTION',
  // Debug mode for development
  debug: process.env.NODE_ENV === 'development',
}; 