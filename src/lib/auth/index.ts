import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

export const getUser = cache(async () => {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    // Redirect to login page or handle unauthenticated state
    return null;
  }

  return user;
});

export const getSession = cache(async () => {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }

  return data.session;
});