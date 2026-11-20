"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ProfileFormValues } from "@/types/profile";

type ProfileFormProps = {
  initialValues: ProfileFormValues;
  /** Saves the profile; resolves to an error message, or null when it was saved. */
  onSubmit: (profileFormValues: ProfileFormValues) => Promise<string | null>;
  onCancel?: () => void;
};

/** The signed-in person's name and job title. Not tied to a page, so it can be reused anywhere. */
export default function ProfileForm({ initialValues, onSubmit, onCancel }: ProfileFormProps) {
  const [formValues, setFormValues] = useState<ProfileFormValues>(initialValues);
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ isError: boolean; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasChanges =
    formValues.fullName.trim() !== initialValues.fullName || formValues.jobTitle.trim() !== initialValues.jobTitle;

  function updateFormValue(fieldName: keyof ProfileFormValues, fieldValue: string) {
    setFormValues((previousFormValues) => ({ ...previousFormValues, [fieldName]: fieldValue }));
    setSaveMessage(null);
    if (fieldName === "fullName") {
      setFullNameError(null);
    }
  }

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedFormValues: ProfileFormValues = {
      fullName: formValues.fullName.trim(),
      jobTitle: formValues.jobTitle.trim(),
    };
    if (!trimmedFormValues.fullName) {
      setFullNameError("Your name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const errorMessage = await onSubmit(trimmedFormValues);
      setSaveMessage(errorMessage ? { isError: true, text: errorMessage } : { isError: false, text: "Saved." });
      if (!errorMessage) {
        setFormValues(trimmedFormValues);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClickCancel() {
    setFormValues(initialValues);
    setFullNameError(null);
    setSaveMessage(null);
    onCancel?.();
  }

  return (
    <form onSubmit={handleSubmitForm} noValidate className="flex flex-col gap-4">
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(fullNameError)}>
          <FieldLabel htmlFor="profile-full-name">Full name</FieldLabel>
          <Input
            id="profile-full-name"
            value={formValues.fullName}
            onChange={(event) => updateFormValue("fullName", event.target.value)}
            aria-invalid={Boolean(fullNameError)}
            autoComplete="name"
          />
          <FieldError>{fullNameError}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-job-title">Job title</FieldLabel>
          <Input
            id="profile-job-title"
            value={formValues.jobTitle}
            onChange={(event) => updateFormValue("jobTitle", event.target.value)}
            autoComplete="organization-title"
          />
        </Field>
      </FieldGroup>

      <div className="flex items-center justify-end gap-3">
        {saveMessage && (
          <p role="status" className={saveMessage.isError ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
            {saveMessage.text}
          </p>
        )}
        <Button type="button" variant="outline" onClick={handleClickCancel} disabled={isSubmitting || !hasChanges}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !hasChanges}>
          Save profile
        </Button>
      </div>
    </form>
  );
}
