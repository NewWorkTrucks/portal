"use client";

import { getNoteLengthError } from "@/lib/rich-note";
import type { LucideIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import UpdateFilesField from "@/components/update-files-field";
import RichNoteEditor from "@/components/rich-note-editor";
import type { Mentionable } from "@/types/mention";

type KanbanOperationNoteFormProps = {
  noteLabel: string;
  notePlaceholder?: string;
  mentionables: Mentionable[];
  submitLabel: string;
  SubmitIcon?: LucideIcon;
  submitVariant?: "default" | "destructive";
  onSubmit: (note: string, files: File[]) => void | Promise<void>;
  /** Shows "Add files". Only the card owner, coordinators and admins can attach files (E1-4). */
  canAttachFiles?: boolean;
  onCancel?: () => void;
};

/**
 * Asks for the required note behind a board operation (move, reassign, archive).
 * Not tied to a dialog, so it can be reused anywhere. The note is never optional (E1-5).
 */
export default function KanbanOperationNoteForm({
  noteLabel,
  notePlaceholder,
  mentionables,
  submitLabel,
  SubmitIcon,
  submitVariant = "default",
  onSubmit,
  canAttachFiles = false,
  onCancel,
}: KanbanOperationNoteFormProps) {
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedNote = note.trim();

    if (!trimmedNote) {
      setNoteError("A note is required.");
      return;
    }
    const noteLengthError = getNoteLengthError(trimmedNote);
    if (noteLengthError) {
      setNoteError(noteLengthError);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedNote, files);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmitForm} noValidate className="flex flex-col gap-6">
      <Field data-invalid={Boolean(noteError)}>
        <FieldLabel htmlFor="kanban-operation-note">{noteLabel}</FieldLabel>
        <RichNoteEditor
          id="kanban-operation-note"
          value={note}
          onChange={(noteValue) => {
            setNote(noteValue);
            setNoteError(null);
          }}
          mentionables={mentionables}
          placeholder={notePlaceholder}
          aria-invalid={Boolean(noteError)}
          rows={3}
          autoFocus
        />
        <FieldDescription>Required. Type @ to mention someone. Saved to the audit log.</FieldDescription>
        <FieldError>{noteError}</FieldError>
      </Field>

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
        <Button type="submit" variant={submitVariant} disabled={isSubmitting}>
          {SubmitIcon && <SubmitIcon aria-hidden />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
