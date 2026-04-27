import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a server-side Supabase admin client using the service role key.
 * Use this in ALL API routes instead of creating per-file clients.
 *
 * - Uses service role key (bypasses RLS) — never expose to client.
 * - Disables session persistence since API routes are stateless.
 * - Throws a descriptive error if env vars are missing.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. " +
        "Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
