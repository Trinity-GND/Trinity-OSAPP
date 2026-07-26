import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client using the public anon key. Only ever used for
 * non-sensitive reads (e.g. public assets); all order/report data
 * goes through our own API routes so role-based field stripping applies.
 */
export function getBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
