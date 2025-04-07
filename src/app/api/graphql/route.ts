import { createYoga } from 'graphql-yoga';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { getServerSession } from 'next-auth';
import { makeExecutableSchema } from '@graphql-tools/schema';

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
    const session = await getServerSession();
    
    // If user is authenticated, add user info to context
    if (session?.user?.email) {
      return {
        request,
        user: {
          email: session.user.email,
        },
      };
    }
    
    return { request };
  },
  graphiql: process.env.NODE_ENV !== 'production',
});

// Route handlers for Next.js App Router
export const GET = yoga;
export const POST = yoga; 