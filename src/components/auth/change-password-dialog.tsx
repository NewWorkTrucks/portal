"use client";

import { changePassword } from "@/api/auth";
import { showSuccessToast } from "@/lib/toast";
import ChangePasswordForm from "@/components/forms/change-password-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ChangePasswordDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export default function ChangePasswordDialog({
  isOpen,
  onOpenChange,
}: ChangePasswordDialogProps) {
  async function handleSubmitNewPassword(
    newPassword: string,
  ): Promise<string | null> {
    const errorMessage = await changePassword(newPassword);
    if (!errorMessage) {
      onOpenChange(false);
      showSuccessToast("Your password was changed");
    }
    return errorMessage;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Replace your temporary password with one only you know.
          </DialogDescription>
        </DialogHeader>
        {isOpen && (
          <ChangePasswordForm
            onSubmit={handleSubmitNewPassword}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
