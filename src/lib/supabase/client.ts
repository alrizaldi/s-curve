import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// For client-side, we need to configure the client with cookie support
let browserClient = null;

if (typeof window !== 'undefined') {
  browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: window.localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    }
  });
}

// Export the client
export const supabase = browserClient;

// Export the createClient function as well
export { createClient } from '@supabase/supabase-js';