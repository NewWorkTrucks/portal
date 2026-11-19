"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MIN_PASSWORD_LENGTH } from "@/constants/auth";

type ChangePasswordFormProps = {
  /** Saves the new password; resolves to an error message, or null when it was saved. */
  onSubmit: (newPassword: string) => Promise<string | null>;
  onCancel?: () => void;
};

/** Sets a new password for the signed-in account. Not tied to a dialog, so it can be reused anywhere. */
export default function ChangePasswordForm({
  onSubmit,
  onCancel,
}: ChangePasswordFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmedPasswordError, setConfirmedPasswordError] = useState<
    string | null
  >(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const isLongEnough = newPassword.length >= MIN_PASSWORD_LENGTH;
    const isConfirmed = confirmedPassword === newPassword;
    setNewPasswordError(
      isLongEnough ? null : `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
    setConfirmedPasswordError(
      isConfirmed ? null : "The passwords don't match.",
    );
    if (!isLongEnough || !isConfirmed) {
      return;
    }

    setIsSubmitting(true);
    setSaveError(null);
    try {
      const errorMessage = await onSubmit(newPassword);
      if (errorMessage) {
        setSaveError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmitForm}
      noValidate
      className="flex flex-col gap-6"
    >
      <Field data-invalid={Boolean(newPasswordError)}>
        <FieldLabel htmlFor="change-password-new">New password</FieldLabel>
        <Input
          id="change-password-new"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => {
            setNewPassword(event.target.value);
            setNewPasswordError(null);
          }}
          aria-invalid={Boolean(newPasswordError)}
          autoFocus
        />
        <FieldDescription>
          At least {MIN_PASSWORD_LENGTH} characters.
        </FieldDescription>
        <FieldError>{newPasswordError}</FieldError>
      </Field>

      <Field data-invalid={Boolean(confirmedPasswordError)}>
        <FieldLabel htmlFor="change-password-confirm">
          Confirm new password
        </FieldLabel>
        <Input
          id="change-password-confirm"
          type="password"
          autoComplete="new-password"
          value={confirmedPassword}
          onChange={(event) => {
            setConfirmedPassword(event.target.value);
            setConfirmedPasswordError(null);
          }}
          aria-invalid={Boolean(confirmedPasswordError)}
        />
        <FieldError>{confirmedPasswordError}</FieldError>
      </Field>

      {saveError && (
        <p role="alert" className="text-sm text-destructive">
          {saveError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          Change password
        </Button>
      </div>
    </form>
  );
}
