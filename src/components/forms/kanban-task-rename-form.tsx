"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import MentionTextarea from "@/components/mention-textarea";
import type { Mentionable } from "@/types/mention";

type KanbanTaskRenameFormProps = {
  initialTitle: string;
  mentionables: Mentionable[];
  onSubmit: (title: string, note: string) => void | Promise<void>;
  onCancel?: () => void;
};

/** Form for renaming a Kanban task, with the required note for the audit log (E1-5). Not tied to a dialog, so it can be reused anywhere. */
export default function KanbanTaskRenameForm({
  initialTitle,
  mentionables,
  onSubmit,
  onCancel,
}: KanbanTaskRenameFormProps) {
  const [taskTitle, setTaskTitle] = useState(initialTitle);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedTaskTitle = taskTitle.trim();
  const isTitleUnchanged = trimmedTaskTitle === initialTitle.trim();

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedNote = note.trim();

    if (!trimmedTaskTitle) {
      setTitleError("Title is required.");
    }
    if (!trimmedNote) {
      setNoteError("A note is required.");
    }
    if (!trimmedTaskTitle || !trimmedNote) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedTaskTitle, trimmedNote);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmitForm} noValidate className="flex flex-col gap-6">
      <Field data-invalid={Boolean(titleError)}>
        <FieldLabel htmlFor="kanban-task-rename-title">Title</FieldLabel>
        <Input
          id="kanban-task-rename-title"
          value={taskTitle}
          onChange={(event) => {
            setTaskTitle(event.target.value);
            setTitleError(null);
          }}
          onFocus={(event) => event.target.select()}
          aria-invalid={Boolean(titleError)}
          autoFocus
        />
        <FieldError>{titleError}</FieldError>
      </Field>

      <Field data-invalid={Boolean(noteError)}>
        <FieldLabel htmlFor="kanban-task-rename-note">Why rename it?</FieldLabel>
        <MentionTextarea
          id="kanban-task-rename-note"
          value={note}
          onChange={(noteValue) => {
            setNote(noteValue);
            setNoteError(null);
          }}
          mentionables={mentionables}
          placeholder="e.g. Scope narrowed to the vendor checklist only."
          aria-invalid={Boolean(noteError)}
          rows={2}
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
        <Button type="submit" disabled={isSubmitting || isTitleUnchanged}>
          Rename
        </Button>
      </div>
    </form>
  );
}
