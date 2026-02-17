import { createClient } from "@supabase/supabase-js";

// ─── Single Supabase client (uses anon key for all operations) ─
// RLS policies are set to allow public read/insert on all tables.

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  supabaseClient = createClient(url, key);
  return supabaseClient;
}
