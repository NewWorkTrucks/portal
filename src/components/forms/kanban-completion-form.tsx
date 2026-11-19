"use client";

import { CircleCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import RichNoteEditor from "@/components/rich-note-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import UpdateFilesField from "@/components/update-files-field";
import type { KanbanCompletionValues } from "@/types/kanban-stages";
import type { Mentionable } from "@/types/mention";

type KanbanCompletionFormProps = {
  mentionables: Mentionable[];
  submitLabel?: string;
  onSubmit: (values: KanbanCompletionValues, files: File[]) => void | Promise<void>;
  /** Shows "Add files". Only the card owner, coordinators and admins can attach files (E1-4). */
  canAttachFiles?: boolean;
  onCancel?: () => void;
};

const COMPLETION_FIELDS: {
  name: keyof KanbanCompletionValues;
  label: string;
  placeholder: string;
  error: string;
}[] = [
  {
    name: "completedWork",
    label: "Completed work",
    placeholder: "e.g. Wrote the template and checked it against management's format.",
    error: "Describe the completed work.",
  },
  {
    name: "outcome",
    label: "Outcome",
    placeholder: "e.g. Template approved for the Friday reports.",
    error: "Describe the outcome.",
  },
  {
    name: "notes",
    label: "Notes",
    placeholder: "e.g. Reuse this for the RWT team later.",
    error: "A note is required.",
  },
];

/** E2-9: the closing summary every Done card needs. */
export default function KanbanCompletionForm({
  mentionables,
  submitLabel = "Mark as Done",
  onSubmit,
  canAttachFiles = false,
  onCancel,
}: KanbanCompletionFormProps) {
  const [formValues, setFormValues] = useState<KanbanCompletionValues>({
    completedWork: "",
    outcome: "",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof KanbanCompletionValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors: Partial<Record<keyof KanbanCompletionValues, string>> = {};
    for (const completionField of COMPLETION_FIELDS) {
      if (!formValues[completionField.name].trim()) {
        validationErrors[completionField.name] = completionField.error;
      }
    }
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        completedWork: formValues.completedWork.trim(),
        outcome: formValues.outcome.trim(),
        notes: formValues.notes.trim(),
      }, files);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmitForm} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        {COMPLETION_FIELDS.map((completionField, fieldIndex) => (
          <Field key={completionField.name} data-invalid={Boolean(formErrors[completionField.name])}>
            <FieldLabel htmlFor={`kanban-completion-${completionField.name}`}>
              {completionField.label}
            </FieldLabel>
            <RichNoteEditor
              id={`kanban-completion-${completionField.name}`}
              value={formValues[completionField.name]}
              onChange={(fieldValue) => {
                setFormValues((previousValues) => ({ ...previousValues, [completionField.name]: fieldValue }));
                setFormErrors((previousErrors) => ({ ...previousErrors, [completionField.name]: undefined }));
              }}
              mentionables={mentionables}
              placeholder={completionField.placeholder}
              aria-invalid={Boolean(formErrors[completionField.name])}
              rows={2}
              autoFocus={fieldIndex === 0}
            />
            <FieldError>{formErrors[completionField.name]}</FieldError>
          </Field>
        ))}
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
          <CircleCheck aria-hidden />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
