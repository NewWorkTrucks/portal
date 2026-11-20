import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { ProfileFormValues } from "@/types/profile";

/**
 * Saves the signed-in person's name and job title (live mode). RLS and column grants only let
 * people update these two fields on their own row. Resolves to an error message, or null when saved.
 */
export async function updateMyProfile(userId: string, profileFormValues: ProfileFormValues): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return "Live mode isn't set up.";
  }
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: profileFormValues.fullName, job_title: profileFormValues.jobTitle })
    .eq("id", userId);
  return error ? error.message : null;
}
