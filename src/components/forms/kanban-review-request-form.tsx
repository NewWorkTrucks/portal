"use client";

import { type FormEvent, useState } from "react";
import RichNoteEditor from "@/components/rich-note-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import UpdateFilesField from "@/components/update-files-field";
import UserAvatar from "@/components/user-avatar";
import { getNoteLengthError } from "@/lib/rich-note";
import type { KanbanReviewRequestValues } from "@/types/kanban-stages";
import type { Mentionable } from "@/types/mention";

type KanbanReviewRequestFormProps = {
  /** Who reviews it: the person who assigned the card (US-4.2). Null when nobody is above the owner. */
  reviewerName: string | null;
  mentionables: Mentionable[];
  onSubmit: (values: KanbanReviewRequestValues, files: File[]) => void | Promise<void>;
  /** Shows "Add files". Only the card owner, department heads and admins can attach files (E1-4). */
  canAttachFiles?: boolean;
  onCancel?: () => void;
};

/** US-4.1, 4.2: submitting work sends it to whoever assigned it, who is mentioned on the request. */
export default function KanbanReviewRequestForm({
  reviewerName,
  mentionables,
  onSubmit,
  canAttachFiles = false,
  onCancel,
}: KanbanReviewRequestFormProps) {
  const [note, setNote] = useState("");
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof KanbanReviewRequestValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewerName) {
      return;
    }

    const validationErrors: Partial<Record<keyof KanbanReviewRequestValues, string>> = {};
    const noteLengthError = getNoteLengthError(note);
    if (!note.trim()) {
      validationErrors.note = "A note is required.";
    } else if (noteLengthError) {
      validationErrors.note = noteLengthError;
    }
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ reviewerName, note: note.trim() }, files);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmitForm} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={!reviewerName}>
          <FieldLabel>Reviewer</FieldLabel>
          {reviewerName ? (
            <>
              <p className="flex items-center gap-2 text-sm">
                <UserAvatar name={reviewerName} className="size-5" />
                {reviewerName}
              </p>
              <FieldDescription>
                The person who assigned this card reviews it. They&rsquo;ll be mentioned on the request.
              </FieldDescription>
            </>
          ) : (
            <FieldError>
              Nobody is above you to review this card, so move it straight to Done instead.
            </FieldError>
          )}
        </Field>

        <Field data-invalid={Boolean(formErrors.note)}>
          <FieldLabel htmlFor="kanban-review-note">What should they check?</FieldLabel>
          <RichNoteEditor
            id="kanban-review-note"
            value={note}
            onChange={(noteValue) => {
              setNote(noteValue);
              setFormErrors((previousErrors) => ({ ...previousErrors, note: undefined }));
            }}
            mentionables={mentionables}
            placeholder="e.g. Template is ready; please check the section order."
            aria-invalid={Boolean(formErrors.note)}
            rows={3}
          />
          <FieldError>{formErrors.note}</FieldError>
        </Field>
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
        <Button type="submit" disabled={isSubmitting || !reviewerName}>
          Request review
        </Button>
      </div>
    </form>
  );
}
