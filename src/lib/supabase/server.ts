import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serviceClient: SupabaseClient | null = null;

/**
 * Server-only client using the service role key. Bypasses RLS.
 * Never import this from a client component or route that runs in the browser.
 */
export function getServiceSupabase(): SupabaseClient {
  if (!serviceClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Missing Supabase server environment variables");
    }
    serviceClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return serviceClient;
}
