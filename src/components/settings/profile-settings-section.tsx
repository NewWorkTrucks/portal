"use client";

import { KeyRound, Mail } from "lucide-react";
import { useState } from "react";
import ChangePasswordDialog from "@/components/auth/change-password-dialog";
import { useCurrentUser } from "@/components/current-user-provider";
import { useDataMode } from "@/components/data-mode-provider";
import ProfileForm from "@/components/forms/profile-form";
import SettingsSection from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";

export default function ProfileSettingsSection() {
  const { signedInUser, updateSignedInUserProfile } = useCurrentUser();
  const { dataMode } = useDataMode();

  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);

  return (
    <SettingsSection title="Profile" description="How teammates see you on cards, mentions and the audit log.">
      <ProfileForm
        // Remount when the person changes (mock "view as" or a new sign-in) so the fields reset.
        key={signedInUser.id}
        initialValues={{ fullName: signedInUser.name, jobTitle: signedInUser.jobTitle }}
        onSubmit={updateSignedInUserProfile}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Mail aria-hidden className="size-4" />
          {signedInUser.email ?? "No email in mock mode"}
          {signedInUser.email && <span className="text-xs">(ask an admin to change it)</span>}
        </span>
        {dataMode === "live" && (
          <Button variant="outline" onClick={() => setIsChangePasswordDialogOpen(true)}>
            <KeyRound aria-hidden />
            Change password
          </Button>
        )}
      </div>
      <ChangePasswordDialog isOpen={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen} />
    </SettingsSection>
  );
}
