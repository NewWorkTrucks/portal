import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { GoogleChatTestKind, GoogleChatTestResult } from "@/types/google-chat-test";

/** Posts a message labeled TEST to the business's Chat space (live mode, admins only). Changes nothing on the board. */
export async function sendGoogleChatTest(
  businessId: string,
  testKind: GoogleChatTestKind,
): Promise<GoogleChatTestResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Live mode isn't set up.");
  }
  const { data, error } = await supabase.rpc("kanban_test_google_chat", {
    p_business_id: businessId,
    p_test: testKind,
  });
  if (error) {
    throw error;
  }
  return data as GoogleChatTestResult;
}
