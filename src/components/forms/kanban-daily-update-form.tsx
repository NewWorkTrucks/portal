"use client";

import { type FormEvent, useState } from "react";
import RichNoteEditor from "@/components/rich-note-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import UpdateFilesField from "@/components/update-files-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KANBAN_DAILY_UPDATE_HEALTH_OPTIONS } from "@/constants/kanban-stages";
import type { KanbanDailyUpdate, KanbanDailyUpdateHealth } from "@/types/kanban-stages";
import type { Mentionable } from "@/types/mention";

type KanbanDailyUpdateFormProps = {
  mentionables: Mentionable[];
  onSubmit: (values: KanbanDailyUpdate, files: File[]) => void | Promise<void>;
  /** Shows "Add files". Only the card owner, coordinators and admins can attach files (E1-4). */
  canAttachFiles?: boolean;
  onCancel?: () => void;
};

type KanbanDailyUpdateErrors = Partial<Record<"progress" | "nextSteps", string>>;

/** E2-3: the workday update for a card in Working on It, so someone else could take it over. */
export default function KanbanDailyUpdateForm({
  mentionables,
  onSubmit,
  canAttachFiles = false,
  onCancel,
}: KanbanDailyUpdateFormProps) {
  const [formValues, setFormValues] = useState<KanbanDailyUpdate>({
    progress: "",
    health: "on-track",
    nextSteps: "",
    issues: "",
  });
  const [formErrors, setFormErrors] = useState<KanbanDailyUpdateErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  function updateFormValue<FieldName extends keyof KanbanDailyUpdate>(
    fieldName: FieldName,
    fieldValue: KanbanDailyUpdate[FieldName],
  ) {
    setFormValues((previousValues) => ({ ...previousValues, [fieldName]: fieldValue }));
    setFormErrors((previousErrors) => ({ ...previousErrors, [fieldName]: undefined }));
  }

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors: KanbanDailyUpdateErrors = {};
    if (!formValues.progress.trim()) {
      validationErrors.progress = "Describe today's progress, or why there was none.";
    }
    if (!formValues.nextSteps.trim()) {
      validationErrors.nextSteps = "List the next steps.";
    }
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formValues,
        progress: formValues.progress.trim(),
        nextSteps: formValues.nextSteps.trim(),
        issues: formValues.issues.trim(),
      }, files);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmitForm} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={Boolean(formErrors.progress)}>
          <FieldLabel htmlFor="kanban-daily-update-progress">Progress</FieldLabel>
          <RichNoteEditor
            id="kanban-daily-update-progress"
            value={formValues.progress}
            onChange={(fieldValue) => updateFormValue("progress", fieldValue)}
            mentionables={mentionables}
            placeholder="e.g. Finished the column components; drag-and-drop still in progress."
            aria-invalid={Boolean(formErrors.progress)}
            rows={3}
            autoFocus
          />
          <FieldDescription>If you couldn&rsquo;t work on it today, say why.</FieldDescription>
          <FieldError>{formErrors.progress}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="kanban-daily-update-health">Status</FieldLabel>
          <Select
            items={KANBAN_DAILY_UPDATE_HEALTH_OPTIONS}
            value={formValues.health}
            onValueChange={(health) =>
              health && updateFormValue("health", health as KanbanDailyUpdateHealth)
            }
          >
            <SelectTrigger id="kanban-daily-update-health" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KANBAN_DAILY_UPDATE_HEALTH_OPTIONS.map((healthOption) => (
                <SelectItem key={healthOption.value} value={healthOption.value}>
                  {healthOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field data-invalid={Boolean(formErrors.nextSteps)}>
          <FieldLabel htmlFor="kanban-daily-update-next">Next steps</FieldLabel>
          <RichNoteEditor
            id="kanban-daily-update-next"
            value={formValues.nextSteps}
            onChange={(fieldValue) => updateFormValue("nextSteps", fieldValue)}
            mentionables={mentionables}
            placeholder="e.g. Enforce required notes before moving between columns."
            aria-invalid={Boolean(formErrors.nextSteps)}
            rows={2}
          />
          <FieldError>{formErrors.nextSteps}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="kanban-daily-update-issues">Issues (optional)</FieldLabel>
          <RichNoteEditor
            id="kanban-daily-update-issues"
            value={formValues.issues}
            onChange={(fieldValue) => updateFormValue("issues", fieldValue)}
            mentionables={mentionables}
            placeholder="Blockers or dependencies. Leave empty if none."
            rows={2}
          />
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
        <Button type="submit" disabled={isSubmitting}>
          Post update
        </Button>
      </div>
    </form>
  );
}
