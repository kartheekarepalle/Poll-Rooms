import { createClient } from "@supabase/supabase-js";

// ─── Server-side Supabase client (uses service role key) ─────
// Used in API routes for privileged operations like inserting votes.
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !key) {
    throw new Error("Missing Supabase server environment variables");
  }

  return createClient(url, key);
}

// ─── Browser-side Supabase client (uses anon key) ────────────
// Used for real-time subscriptions and safe read operations.
let browserClient: ReturnType<typeof createClient> | null = null;

export function createBrowserClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !key) {
    throw new Error("Missing Supabase browser environment variables");
  }

  browserClient = createClient(url, key);
  return browserClient;
}
