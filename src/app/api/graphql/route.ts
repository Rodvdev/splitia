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
      console.warn('No Authorization header or invalid format');
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
      acc[key] = key === 'authorization' ? 'Bearer [redacted]' : value;
      return acc;
    }, {} as Record<string, string>));
    
    try {
      // Get session from cookie or token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting auth session:', sessionError);
      }
      
      // If user is authenticated, add user info to context
      if (session?.user) {
        try {
          // For debugging
          console.log('Authenticated request from user:', session.user.email);
          console.log('Supabase user ID:', session.user.id);
          
          // Find the user in the database using the external ID from Supabase
          const dbUser = await prisma.user.findUnique({
            where: { 
              externalId: session.user.id 
            }
          });
          
          if (!dbUser) {
            console.error('No database user found for authenticated Supabase user:', session.user.id);
            
            // Check if user exists with email instead (fallback)
            const userByEmail = await prisma.user.findUnique({
              where: {
                email: session.user.email || ''
              }
            });
            
            if (userByEmail) {
              console.log('Found user by email instead of externalId, updating user record...');
              
              // Update the user record with the externalId
              const updatedUser = await prisma.user.update({
                where: { id: userByEmail.id },
                data: { externalId: session.user.id }
              });
              
              // Use the updated user
              return {
                request,
                user: {
                  id: updatedUser.id,
                  email: updatedUser.email,
                  externalId: session.user.id,
                },
              };
            }
            
            // If still no user, create one (ensure we have a user for authenticated sessions)
            console.log('Attempting to create a new user record');
            try {
              // Create minimal user record for authenticated user
              const newUser = await prisma.user.create({
                data: {
                  name: session.user.email?.split('@')[0] || 'New User',
                  email: session.user.email || '',
                  externalId: session.user.id
                }
              });
              
              console.log('Created new user record with ID:', newUser.id);
              
              return {
                request,
                user: {
                  id: newUser.id,
                  email: newUser.email,
                  externalId: session.user.id,
                },
              };
            } catch (createError) {
              console.error('Failed to create user record:', createError);
              
              // If we're unable to create a user, try one more refresh of the auth session
              try {
                const { data: refreshData } = await supabase.auth.refreshSession();
                if (refreshData.session) {
                  console.log('Auth session refreshed after user creation failed');
                }
              } catch (refreshError) {
                console.error('Failed to refresh session after user creation error:', refreshError);
              }
            }
            
            return { request };
          }
          
          console.log('Found database user with ID:', dbUser.id);
          
          // Pass the database user data to resolvers
          return {
            request,
            user: {
              id: dbUser.id, // Use the Prisma user ID, not the Supabase ID
              email: dbUser.email,
              externalId: session.user.id,
            },
          };
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
            
            // If we got a refreshed session, we should retry the auth flow, but we can't
            // reference yoga here, so just log it
            console.log('Session refreshed, but cannot recursively retry auth check');
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

// Route handlers for Next.js App Router
export const GET = (request: NextRequest) => yoga.fetch(request);
export const POST = (request: NextRequest) => yoga.fetch(request); 