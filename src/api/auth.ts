import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { DataMode } from "@/types/data-mode";

export async function signOut(dataMode: DataMode): Promise<void> {
  if (dataMode === "mock") {
    // TODO: Mock mode has no session; live mode signs out of Supabase below.
    window.alert("TODO: sign out (mock mode has no session)");
    return;
  }

  // LiveCurrentUserProvider sees the SIGNED_OUT event and sends the user to /login.
  await getSupabaseBrowserClient()?.auth.signOut();
}
