import { createYoga } from 'graphql-yoga';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create a Yoga instance with the GraphQL schema
const yoga = createYoga({
  schema,
  // Yoga specific options
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
  context: async ({ request }) => {
    try {
      // For debugging - Avoid logging sensitive headers to production logs
      if (process.env.NODE_ENV !== 'production') {
        const headers = Object.fromEntries([...request.headers.entries()].map(([key, value]) => {
          if (key.toLowerCase() === 'authorization') {
            return [key, 'Bearer [redacted]'];
          }
          if (key.toLowerCase() === 'cookie') {
            return [key, '[redacted]'];
          }
          return [key, value];
        }));
        console.log('Request headers:', headers);
      }
      
      // Authentication method 1: Try NextAuth session first
      const session = await getServerSession(authOptions);
      
      if (session?.user?.id) {
        console.log('Authenticated via NextAuth session:', session.user.email);
        
        return {
          request,
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
          },
        };
      }
      
      // Authentication method 2: Try Authorization header
      const authHeader = request.headers.get('authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract token from header
        const token = authHeader.substring(7);
        
        // In a real app, you'd verify the token
        // For now, we're using a simple token format: userId_timestamp_random
        if (token && token.includes('_')) {
          const userId = token.split('_')[0];
          
          // Get user details from the database using the userId
          const user = await prisma.user.findUnique({
            where: { id: userId }
          });
          
          if (user) {
            console.log('Authenticated via Bearer token:', user.email);
            return {
              request,
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
              },
            };
          }
        }
      }
      
      // Authentication method 3: Try custom cookies
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        const userId = cookies['user_id'];
        
        if (userId) {
          const user = await prisma.user.findUnique({
            where: { id: userId }
          });
          
          if (user) {
            console.log('Authenticated via custom cookie:', user.email);
            return {
              request,
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
              },
            };
          }
        }
      }
      
      // No authentication found
      console.warn('Unauthenticated GraphQL request received');
      
    } catch (error) {
      console.error('Error in GraphQL context function:', error);
    }
    
    // Always return a context object, even without user data
    return { request };
  },
  graphiql: process.env.NODE_ENV !== 'production',
});

// Route handlers for Next.js App Router
export const GET = async (request: NextRequest) => yoga.fetch(request);
export const POST = async (request: NextRequest) => yoga.fetch(request); 