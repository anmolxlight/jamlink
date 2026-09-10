import Constants from 'expo-constants';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ponytail: static member access ONLY. Metro inlines process.env.EXPO_PUBLIC_*
// at bundle time; dynamic process.env[key] survives as undefined and crashes
// the release app at import. Every env read in this file must stay literal.
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  (Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL as string) ??
  '';
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  (Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY as string) ??
  '';
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
