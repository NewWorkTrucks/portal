"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MENTION_HANDLE_PATTERN } from "@/constants/mention-groups";
import type { MentionGroupFormValues } from "@/types/mention";

type MentionGroupFormErrors = Partial<Record<keyof MentionGroupFormValues, string>>;

type MentionGroupFormProps = {
  initialValues: MentionGroupFormValues;
  /** Handles already used by people or groups in the business (compared case-insensitively). */
  takenHandles: string[];
  submitLabel?: string;
  onSubmit: (mentionGroupFormValues: MentionGroupFormValues) => Promise<void>;
  onCancel?: () => void;
};

/** Turns a label like "Sales team" into a handle like "SalesTeam". */
function suggestHandle(label: string): string {
  return label
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("")
    .replace(/^[^A-Za-z]+/, "");
}

/** A new mention group's name and @handle. Not tied to a page, so it can be reused anywhere. */
export default function MentionGroupForm({
  initialValues,
  takenHandles,
  submitLabel = "Create group",
  onSubmit,
  onCancel,
}: MentionGroupFormProps) {
  const [formValues, setFormValues] = useState<MentionGroupFormValues>(initialValues);
  const [isHandleEdited, setIsHandleEdited] = useState(Boolean(initialValues.handle));
  const [formErrors, setFormErrors] = useState<MentionGroupFormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChangeLabel(label: string) {
    setFormValues((previousFormValues) => ({
      label,
      // Keep suggesting a handle until the person types their own.
      handle: isHandleEdited ? previousFormValues.handle : suggestHandle(label),
    }));
    setFormErrors({});
    setSaveError(null);
  }

  function handleChangeHandle(handle: string) {
    setIsHandleEdited(true);
    setFormValues((previousFormValues) => ({ ...previousFormValues, handle: handle.replace(/^@/, "") }));
    setFormErrors((previousFormErrors) => ({ ...previousFormErrors, handle: undefined }));
    setSaveError(null);
  }

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedFormValues = { label: formValues.label.trim(), handle: formValues.handle.trim() };
    const validationErrors: MentionGroupFormErrors = {};
    if (!trimmedFormValues.label) {
      validationErrors.label = "Give the group a name.";
    }
    if (!MENTION_HANDLE_PATTERN.test(trimmedFormValues.handle)) {
      validationErrors.handle = "Start with a letter; use only letters, numbers, _ or -.";
    } else if (
      takenHandles.some((takenHandle) => takenHandle.toLowerCase() === trimmedFormValues.handle.toLowerCase())
    ) {
      validationErrors.handle = `@${trimmedFormValues.handle} is already used by a person or group.`;
    }
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedFormValues);
    } catch (submitError) {
      setSaveError(submitError instanceof Error ? submitError.message : "Couldn't create the group.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmitForm} noValidate className="flex flex-col gap-4">
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(formErrors.label)}>
          <FieldLabel htmlFor="mention-group-label">Name</FieldLabel>
          <Input
            id="mention-group-label"
            value={formValues.label}
            onChange={(event) => handleChangeLabel(event.target.value)}
            aria-invalid={Boolean(formErrors.label)}
            placeholder="e.g. Sales team"
            autoFocus
          />
          <FieldError>{formErrors.label}</FieldError>
        </Field>
        <Field data-invalid={Boolean(formErrors.handle)}>
          <FieldLabel htmlFor="mention-group-handle">Handle</FieldLabel>
          <Input
            id="mention-group-handle"
            value={formValues.handle ? `@${formValues.handle}` : ""}
            onChange={(event) => handleChangeHandle(event.target.value)}
            aria-invalid={Boolean(formErrors.handle)}
            placeholder="@SalesTeam"
          />
          <FieldDescription>What people type to mention the group. Can&rsquo;t be changed later.</FieldDescription>
          <FieldError>{formErrors.handle}</FieldError>
        </Field>
      </FieldGroup>

      <div className="flex items-center justify-end gap-2">
        {saveError && (
          <p role="alert" className="mr-auto text-sm text-destructive">
            {saveError}
          </p>
        )}
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
