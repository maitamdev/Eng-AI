import { createBrowserClient } from '@supabase/ssr';
import { type Database } from '../types/database';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
};
