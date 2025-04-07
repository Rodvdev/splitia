import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// This will be expanded with actual database schema types later
export type Database = Record<string, unknown>;

/**
 * Creates a Supabase client for use in the browser
 */
export function createClient() {
  return createClientComponentClient<Database>();
} 