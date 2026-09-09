import Constants from 'expo-constants';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function env(key: string): string {
  return (
    (Constants.expoConfig?.extra?.[key] as string) ??
    (process.env[key] as string) ??
    ''
  );
}

export const SUPABASE_URL = env('EXPO_PUBLIC_SUPABASE_URL');
export const SUPABASE_ANON_KEY = env('EXPO_PUBLIC_SUPABASE_ANON_KEY');
export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient | null {
  if (!isConfigured) return null; // ponytail: graceful empty-state, no throw
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}

export type Jam = {
  id: string;
  host_id: string;
  title: string;
  spotify_url: string;
  genre: string;
  description: string;
  is_open: boolean;
  member_count: number;
  created_at: string;
};
