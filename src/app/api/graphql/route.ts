import { createYoga } from 'graphql-yoga';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { createClient } from '@supabase/supabase-js';

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
    
    // Get session from cookie or token
    const { data: { session } } = await supabase.auth.getSession();
    
    // If user is authenticated, add user info to context
    if (session?.user) {
      try {
        // For debugging
        console.log('Authenticated request from user:', session.user.email);
        
        // Pass the session user data directly to resolvers
        return {
          request,
          user: {
            id: session.user.id,
            email: session.user.email,
          },
        };
      } catch (error) {
        console.error('Error setting user context:', error);
      }
    } else {
      // For debugging
      console.warn('Unauthenticated GraphQL request received');
    }
    
    return { request };
  },
  graphiql: process.env.NODE_ENV !== 'production',
});

// Route handlers for Next.js App Router
export const GET = yoga;
export const POST = yoga; 