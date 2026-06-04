import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize the Supabase client
let supabaseInstance: SupabaseClient<any, string, any> | null = null;

// Initialize the client only in the browser
if (typeof window !== 'undefined') {
  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: window.localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    }
  });
}

// Export the client instance
export { supabaseInstance as supabase };

// Export a function to get the client that throws an error if not in browser
export const getSupabaseClient = (): SupabaseClient<any, string, any> => {
  if (!supabaseInstance) {
    throw new Error('Supabase client can only be used in the browser');
  }
  return supabaseInstance;
};

// Export the createClient function as well
export { createClient } from '@supabase/supabase-js';