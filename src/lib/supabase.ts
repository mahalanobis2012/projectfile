import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Project = {
  id: string;
  user_id: string;
  name: string;
  image_url: string | null;
  thumbnail: string | null;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};
