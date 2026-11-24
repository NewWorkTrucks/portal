"use client";

import { type FormEvent, useState } from "react";
import RichNoteEditor from "@/components/rich-note-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import UpdateFilesField from "@/components/update-files-field";
import { Input } from "@/components/ui/input";
import { getTodayIsoDate } from "@/lib/kanban";
import { getNoteLengthError } from "@/lib/rich-note";
import type { KanbanWaitingValues } from "@/types/kanban-stages";
import type { Mentionable } from "@/types/mention";

type KanbanWaitingFormProps = {
  mentionables: Mentionable[];
  onSubmit: (values: KanbanWaitingValues, files: File[]) => void | Promise<void>;
  /** Shows "Add files". Only the card owner, department heads and admins can attach files (E1-4). */
  canAttachFiles?: boolean;
  onCancel?: () => void;
};

/** E2-6: what the card waits on, who, when they were contacted and when to follow up. */
export default function KanbanWaitingForm({ mentionables, onSubmit, canAttachFiles = false, onCancel }: KanbanWaitingFormProps) {
  const [formValues, setFormValues] = useState<KanbanWaitingValues>({
    waitingOnWhat: "",
    waitingOnWho: "",
    contactedDate: getTodayIsoDate(),
    followUpDate: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof KanbanWaitingValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  function updateFormValue(fieldName: keyof KanbanWaitingValues, fieldValue: string) {
    setFormValues((previousValues) => ({ ...previousValues, [fieldName]: fieldValue }));
    setFormErrors((previousErrors) => ({ ...previousErrors, [fieldName]: undefined }));
  }

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedValues: KanbanWaitingValues = {
      ...formValues,
      waitingOnWhat: formValues.waitingOnWhat.trim(),
      waitingOnWho: formValues.waitingOnWho.trim(),
    };
    const validationErrors: Partial<Record<keyof KanbanWaitingValues, string>> = {};
    if (!trimmedValues.waitingOnWhat) {
      validationErrors.waitingOnWhat = "Say what you're waiting for.";
    }
    if (!trimmedValues.waitingOnWho) {
      validationErrors.waitingOnWho = "Say who you're waiting on.";
    }
    for (const fieldName of ["waitingOnWhat", "waitingOnWho"] as const) {
      const fieldLengthError = getNoteLengthError(trimmedValues[fieldName]);
      if (fieldLengthError) {
        validationErrors[fieldName] = fieldLengthError;
      }
    }
    if (!trimmedValues.contactedDate) {
      validationErrors.contactedDate = "Enter when you contacted them.";
    }
    if (!trimmedValues.followUpDate) {
      validationErrors.followUpDate = "Enter a follow-up date.";
    } else if (trimmedValues.contactedDate && trimmedValues.followUpDate < trimmedValues.contactedDate) {
      validationErrors.followUpDate = "Follow up on or after the date you contacted them.";
    }
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedValues, files);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmitForm} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={Boolean(formErrors.waitingOnWhat)}>
          <FieldLabel htmlFor="kanban-waiting-what">What are you waiting for?</FieldLabel>
          <RichNoteEditor
            id="kanban-waiting-what"
            value={formValues.waitingOnWhat}
            onChange={(fieldValue) => updateFormValue("waitingOnWhat", fieldValue)}
            mentionables={mentionables}
            placeholder="e.g. The supplier's revised quote"
            aria-invalid={Boolean(formErrors.waitingOnWhat)}
            rows={2}
          />
          <FieldError>{formErrors.waitingOnWhat}</FieldError>
        </Field>

        <Field data-invalid={Boolean(formErrors.waitingOnWho)}>
          <FieldLabel htmlFor="kanban-waiting-who">Who are you waiting on?</FieldLabel>
          <Input
            id="kanban-waiting-who"
            value={formValues.waitingOnWho}
            onChange={(event) => updateFormValue("waitingOnWho", event.target.value)}
            placeholder="e.g. Supplier account manager"
            aria-invalid={Boolean(formErrors.waitingOnWho)}
          />
          <FieldError>{formErrors.waitingOnWho}</FieldError>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={Boolean(formErrors.contactedDate)}>
            <FieldLabel htmlFor="kanban-waiting-contacted">Date contacted</FieldLabel>
            <Input
              id="kanban-waiting-contacted"
              type="date"
              value={formValues.contactedDate}
              onChange={(event) => updateFormValue("contactedDate", event.target.value)}
              aria-invalid={Boolean(formErrors.contactedDate)}
            />
            <FieldError>{formErrors.contactedDate}</FieldError>
          </Field>

          <Field data-invalid={Boolean(formErrors.followUpDate)}>
            <FieldLabel htmlFor="kanban-waiting-follow-up">Follow-up date</FieldLabel>
            <Input
              id="kanban-waiting-follow-up"
              type="date"
              value={formValues.followUpDate}
              onChange={(event) => updateFormValue("followUpDate", event.target.value)}
              aria-invalid={Boolean(formErrors.followUpDate)}
            />
            <FieldError>{formErrors.followUpDate}</FieldError>
          </Field>
        </div>
        <FieldDescription>You&rsquo;ll get a reminder on the follow-up date.</FieldDescription>
      </FieldGroup>

      {canAttachFiles && (
        <Field>
          <FieldLabel>Files (optional)</FieldLabel>
          <UpdateFilesField files={files} onChangeFiles={setFiles} disabled={isSubmitting} />
        </Field>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          Move to Waiting
        </Button>
      </div>
    </form>
  );
}
