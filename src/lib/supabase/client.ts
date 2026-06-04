import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize the browser client (safe for both client and SSR)
export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export a function to get the client
export const getSupabaseClient = (): SupabaseClient<any, string, any> => {
  return supabase;
};

// Export the createClient function as well for compatibility
export { createClient } from '@supabase/supabase-js';