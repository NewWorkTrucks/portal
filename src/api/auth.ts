import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { DataMode } from "@/types/data-mode";

const SIGN_IN_NOT_SET_UP_MESSAGE = "Sign-in isn't set up.";

/** Resolves to an error message, or null once signed in (live mode). */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return SIGN_IN_NOT_SET_UP_MESSAGE;
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) {
    return null;
  }
  // Same message for an unknown email and a wrong password, so accounts can't be probed.
  return error.code === "invalid_credentials"
    ? "Email or password is incorrect."
    : error.message;
}

/** Resolves to an error message, or null once the signed-in account's password is changed. */
export async function changePassword(
  newPassword: string,
): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return SIGN_IN_NOT_SET_UP_MESSAGE;
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (!error) {
    return null;
  }
  return error.code === "same_password"
    ? "Choose a password different from your current one."
    : error.message;
}

export async function signOut(dataMode: DataMode): Promise<void> {
  if (dataMode === "mock") {
    // TODO: Mock mode has no session; live mode signs out of Supabase below.
    window.alert("TODO: sign out (mock mode has no session)");
    return;
  }

  // LiveCurrentUserProvider sees the SIGNED_OUT event and sends the user to /login.
  await getSupabaseBrowserClient()?.auth.signOut();
}
