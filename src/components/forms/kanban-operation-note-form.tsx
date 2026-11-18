"use client";

import type { LucideIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import MentionTextarea from "@/components/mention-textarea";
import type { Mentionable } from "@/types/mention";

type KanbanOperationNoteFormProps = {
  noteLabel: string;
  notePlaceholder?: string;
  mentionables: Mentionable[];
  submitLabel: string;
  SubmitIcon?: LucideIcon;
  submitVariant?: "default" | "destructive";
  onSubmit: (note: string) => void | Promise<void>;
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
  onCancel,
}: KanbanOperationNoteFormProps) {
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedNote = note.trim();

    if (!trimmedNote) {
      setNoteError("A note is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedNote);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmitForm} noValidate className="flex flex-col gap-6">
      <Field data-invalid={Boolean(noteError)}>
        <FieldLabel htmlFor="kanban-operation-note">{noteLabel}</FieldLabel>
        <MentionTextarea
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
