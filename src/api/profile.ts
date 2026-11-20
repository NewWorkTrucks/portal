import { PROFILE_PHOTO_BUCKET, PROFILE_PHOTO_URL_LIFETIME_SECONDS } from "@/constants/profile-photos";
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

/** Signed links for profile photos, keyed by storage path (live mode). Missing paths get no link. */
export async function getProfilePhotoUrls(photoPaths: string[]): Promise<Map<string, string>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || photoPaths.length === 0) {
    return new Map();
  }
  const { data } = await supabase.storage
    .from(PROFILE_PHOTO_BUCKET)
    .createSignedUrls(photoPaths, PROFILE_PHOTO_URL_LIFETIME_SECONDS);
  return new Map(
    (data ?? []).flatMap((signedUrl) =>
      signedUrl.path && signedUrl.signedUrl ? [[signedUrl.path, signedUrl.signedUrl] as const] : [],
    ),
  );
}

/**
 * Replaces the signed-in person's photo (live mode): uploads the new one to their own folder,
 * points their profile at it, then removes the old file. Pass null to remove the photo.
 * Resolves to the new photo's path (or null when removed).
 */
export async function replaceMyProfilePhoto(
  userId: string,
  previousPhotoPath: string | null,
  photoBlob: Blob | null,
): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Live mode isn't set up.");
  }

  let newPhotoPath: string | null = null;
  if (photoBlob) {
    const fileExtension = photoBlob.type === "image/webp" ? "webp" : "png";
    newPhotoPath = `${userId}/${crypto.randomUUID()}.${fileExtension}`;
    const { error: uploadError } = await supabase.storage
      .from(PROFILE_PHOTO_BUCKET)
      .upload(newPhotoPath, photoBlob, { contentType: photoBlob.type });
    if (uploadError) {
      throw uploadError;
    }
  }

  const { error: updateError } = await supabase.from("profiles").update({ avatar_path: newPhotoPath }).eq("id", userId);
  if (updateError) {
    if (newPhotoPath) {
      await supabase.storage.from(PROFILE_PHOTO_BUCKET).remove([newPhotoPath]);
    }
    throw updateError;
  }

  if (previousPhotoPath) {
    // Best effort: a leftover file is harmless and only its owner's teammates can see it.
    await supabase.storage.from(PROFILE_PHOTO_BUCKET).remove([previousPhotoPath]);
  }
  return newPhotoPath;
}
