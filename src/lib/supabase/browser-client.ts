import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient | null = null;

/**
 * The signed-in user's Supabase client, for live mode. Requests run as that user, so RLS
 * applies. Returns null when Supabase isn't configured in .env.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const supabaseConfig = getSupabaseConfig();
  if (!supabaseConfig) {
    return null;
  }
  browserClient ??= createBrowserClient(supabaseConfig.url, supabaseConfig.publishableKey);
  return browserClient;
}
