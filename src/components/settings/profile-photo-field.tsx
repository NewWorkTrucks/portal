"use client";

import { ImageUp, Trash2 } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/user-avatar";
import { ACCEPTED_PROFILE_PHOTO_TYPES, MAX_PROFILE_PHOTO_INPUT_BYTES } from "@/constants/profile-photos";

/** Upload, replace or remove the signed-in person's profile photo. Saves as soon as a file is picked. */
export default function ProfilePhotoField() {
  const { signedInUser, updateSignedInUserPhoto } = useCurrentUser();

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function savePhoto(photoFile: File | null) {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      setErrorMessage(await updateSignedInUserPhoto(photoFile));
    } finally {
      setIsSaving(false);
    }
  }

  function handleChangeFileInput(event: ChangeEvent<HTMLInputElement>) {
    const photoFile = event.target.files?.[0];
    // Clear the input so picking the same file again still triggers a change.
    event.target.value = "";
    if (!photoFile) {
      return;
    }
    if (!ACCEPTED_PROFILE_PHOTO_TYPES.includes(photoFile.type)) {
      setErrorMessage("Use a JPG, PNG or WebP image.");
      return;
    }
    if (photoFile.size > MAX_PROFILE_PHOTO_INPUT_BYTES) {
      setErrorMessage("Use an image under 10 MB.");
      return;
    }
    void savePhoto(photoFile);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <UserAvatar name={signedInUser.name} size="lg" className="size-16 text-lg" />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={isSaving} onClick={() => fileInputRef.current?.click()}>
            <ImageUp aria-hidden />
            {signedInUser.photoUrl ? "Change photo" : "Upload photo"}
          </Button>
          {signedInUser.photoUrl && (
            <Button variant="ghost" disabled={isSaving} onClick={() => void savePhoto(null)}>
              <Trash2 aria-hidden />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {isSaving ? "Saving…" : "JPG, PNG or WebP. Cropped to a square. Only your teammates can see it."}
        </p>
        {errorMessage && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_PROFILE_PHOTO_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={handleChangeFileInput}
      />
    </div>
  );
}
