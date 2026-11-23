"use client";

import { TriangleAlert } from "lucide-react";
import { type FormEvent, useState } from "react";
import RichNoteEditor from "@/components/rich-note-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import UpdateFilesField from "@/components/update-files-field";
import { getNoteLengthError } from "@/lib/rich-note";
import type { KanbanStuckValues } from "@/types/kanban-stages";
import type { Mentionable } from "@/types/mention";

type KanbanStuckFormProps = {
  mentionables: Mentionable[];
  onSubmit: (values: KanbanStuckValues, files: File[]) => void | Promise<void>;
  /** Shows "Add files". Only the card owner, coordinators and admins can attach files (E1-4). */
  canAttachFiles?: boolean;
  onCancel?: () => void;
};

const STUCK_FIELDS: { name: keyof KanbanStuckValues; label: string; placeholder: string; error: string }[] = [
  {
    name: "blocker",
    label: "What's blocking you?",
    placeholder: "e.g. The export API is rate-limited on our plan.",
    error: "Describe the blocker.",
  },
  {
    name: "attempts",
    label: "What have you tried?",
    placeholder: "e.g. Batching exports overnight; still throttled.",
    error: "Say what you've tried.",
  },
  {
    name: "helpNeeded",
    label: "What help do you need?",
    placeholder: "e.g. A decision on a temporary plan upgrade.",
    error: "Say what help you need.",
  },
];

/** E2-7: raising a blocker. Confirming notifies Leadership. */
export default function KanbanStuckForm({ mentionables, onSubmit, canAttachFiles = false, onCancel }: KanbanStuckFormProps) {
  const [formValues, setFormValues] = useState<KanbanStuckValues>({
    blocker: "",
    attempts: "",
    helpNeeded: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof KanbanStuckValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors: Partial<Record<keyof KanbanStuckValues, string>> = {};
    for (const stuckField of STUCK_FIELDS) {
      const fieldLengthError = getNoteLengthError(formValues[stuckField.name]);
      if (!formValues[stuckField.name].trim()) {
        validationErrors[stuckField.name] = stuckField.error;
      } else if (fieldLengthError) {
        validationErrors[stuckField.name] = fieldLengthError;
      }
    }
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        blocker: formValues.blocker.trim(),
        attempts: formValues.attempts.trim(),
        helpNeeded: formValues.helpNeeded.trim(),
      }, files);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmitForm} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        {STUCK_FIELDS.map((stuckField, fieldIndex) => (
          <Field key={stuckField.name} data-invalid={Boolean(formErrors[stuckField.name])}>
            <FieldLabel htmlFor={`kanban-stuck-${stuckField.name}`}>{stuckField.label}</FieldLabel>
            <RichNoteEditor
              id={`kanban-stuck-${stuckField.name}`}
              value={formValues[stuckField.name]}
              onChange={(fieldValue) => {
                setFormValues((previousValues) => ({ ...previousValues, [stuckField.name]: fieldValue }));
                setFormErrors((previousErrors) => ({ ...previousErrors, [stuckField.name]: undefined }));
              }}
              mentionables={mentionables}
              placeholder={stuckField.placeholder}
              aria-invalid={Boolean(formErrors[stuckField.name])}
              rows={2}
              autoFocus={fieldIndex === 0}
            />
            <FieldError>{formErrors[stuckField.name]}</FieldError>
          </Field>
        ))}
      </FieldGroup>

      <p className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
        <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        Marking this card Stuck notifies @Leadership.
      </p>

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
        <Button type="submit" variant="destructive" disabled={isSubmitting}>
          Mark as Stuck
        </Button>
      </div>
    </form>
  );
}
