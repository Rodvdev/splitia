import { createYoga } from 'graphql-yoga';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
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
    // Extract cookies from request headers
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Get the authorization header for Bearer token
    const authHeader = request.headers.get('authorization') || '';
    let token = '';
    
    // Extract token from Authorization header if it exists
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('Authorization header found with token');
    } else {
      // Look for Authorization header from middleware (case sensitive)
      const middlewareAuthHeader = request.headers.get('Authorization') || '';
      if (middlewareAuthHeader && middlewareAuthHeader.startsWith('Bearer ')) {
        token = middlewareAuthHeader.substring(7);
        console.log('Middleware Authorization header found with token');
      } else {
        console.warn('No Authorization header or invalid format');
      }
    }
    
    // Create Supabase client with auth info
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: {
          headers: {
            cookie: cookieHeader,
            // Add authorization header if token exists
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
        },
        auth: {
          persistSession: false, // No need to persist in the API route
        },
      }
    );
    
    // Log all headers for debugging
    console.log('Request headers:', [...request.headers.entries()].reduce((acc, [key, value]) => {
      acc[key] = key.toLowerCase() === 'authorization' ? 'Bearer [redacted]' : value;
      return acc;
    }, {} as Record<string, string>));
    
    try {
      // Get session from cookie or token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting auth session:', sessionError);
      }
      
      // If no session was found but we have a token, try to get the session directly from the token
      if (!session && token) {
        console.log('No session found from cookies, trying with token directly');
        try {
          const { data: tokenData, error: tokenError } = await supabase.auth.getUser(token);
          
          if (tokenError) {
            console.error('Error getting user from token:', tokenError);
          } else if (tokenData.user) {
            console.log('User found from token:', tokenData.user.email);
            
            // Find or create user in database
            const dbUser = await getUserFromSupabaseId(tokenData.user.id, tokenData.user.email);
            
            if (dbUser) {
              return {
                request,
                user: {
                  id: dbUser.id,
                  email: dbUser.email,
                  externalId: tokenData.user.id,
                },
              };
            }
          }
        } catch (tokenCheckError) {
          console.error('Error checking token:', tokenCheckError);
        }
      }
      
      // If user is authenticated, add user info to context
      if (session?.user) {
        try {
          // For debugging
          console.log('Authenticated request from user:', session.user.email);
          console.log('Supabase user ID:', session.user.id);
          
          // Find the user in the database using the external ID from Supabase
          const dbUser = await getUserFromSupabaseId(session.user.id, session.user.email);
          
          if (dbUser) {
            return {
              request,
              user: {
                id: dbUser.id,
                email: dbUser.email,
                externalId: session.user.id,
              },
            };
          }
        } catch (error) {
          console.error('Error setting user context:', error);
        }
      } else {
        // For debugging
        console.warn('Unauthenticated GraphQL request received - No valid session found');
        
        // Try to refresh the session if no session is found
        try {
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData.session) {
            console.log('Session refreshed after initial check failed');
            
            // If we got a refreshed session, try to get the user
            const dbUser = await getUserFromSupabaseId(
              refreshData.session.user.id, 
              refreshData.session.user.email || ''
            );
            
            if (dbUser) {
              return {
                request,
                user: {
                  id: dbUser.id,
                  email: dbUser.email,
                  externalId: refreshData.session.user.id,
                },
              };
            }
          }
        } catch (refreshError) {
          console.error('Failed to refresh session in context:', refreshError);
        }
      }
    } catch (error) {
      console.error('Error in GraphQL context function:', error);
    }
    
    return { request };
  },
  graphiql: process.env.NODE_ENV !== 'production',
});

// Helper function to find or create a user in the database
async function getUserFromSupabaseId(supabaseId: string, email: string | null = null) {
  try {
    // Find user by externalId first
    let dbUser = await prisma.user.findUnique({
      where: { 
        externalId: supabaseId 
      }
    });
    
    if (!dbUser && email) {
      // Check if user exists with email instead (fallback)
      const userByEmail = await prisma.user.findUnique({
        where: {
          email: email
        }
      });
      
      if (userByEmail) {
        console.log('Found user by email instead of externalId, updating user record...');
        
        // Update the user record with the externalId
        dbUser = await prisma.user.update({
          where: { id: userByEmail.id },
          data: { externalId: supabaseId }
        });
      } else {
        // If still no user, create one (ensure we have a user for authenticated sessions)
        console.log('Attempting to create a new user record');
        try {
          // Create minimal user record for authenticated user
          dbUser = await prisma.user.create({
            data: {
              name: email?.split('@')[0] || 'New User',
              email: email || '',
              externalId: supabaseId
            }
          });
          
          console.log('Created new user record with ID:', dbUser.id);
        } catch (createError) {
          console.error('Failed to create user record:', createError);
          return null;
        }
      }
    }
    
    return dbUser;
  } catch (error) {
    console.error('Error in getUserFromSupabaseId:', error);
    return null;
  }
}

// Route handlers for Next.js App Router
export const GET = (request: NextRequest) => yoga.fetch(request);
export const POST = (request: NextRequest) => yoga.fetch(request); 