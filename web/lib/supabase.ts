import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ponytail: memoized so every page shares one GoTrue client. Two clients on the
// same page race each other for the PKCE verifier in localStorage.
let client: SupabaseClient | null = null;

export function getSupabase() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client = createClient(url, key, {
    // PKCE is what turns the magic link into a ?code= we can exchange in /auth/callback.
    // detectSessionInUrl also lets any page recover a session if Supabase falls back to site_url.
    auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
  });
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
