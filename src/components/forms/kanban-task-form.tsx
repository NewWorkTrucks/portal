"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import MentionTextarea from "@/components/mention-textarea";
import UserAvatar from "@/components/user-avatar";
import { KANBAN_COLUMNS } from "@/constants/kanban-columns";
import {
  KANBAN_TASK_PRIORITY_OPTIONS,
  KANBAN_TURNAROUND_UNIT_OPTIONS,
} from "@/constants/kanban-task-priorities";
import type {
  KanbanStatus,
  KanbanTaskFormMode,
  KanbanTaskFormValues,
  KanbanTaskPriority,
  KanbanTurnaroundUnit,
} from "@/types/kanban";
import type { Mentionable } from "@/types/mention";
import type { TeamMember } from "@/types/team";

const KANBAN_STATUS_OPTIONS = KANBAN_COLUMNS.map((column) => ({
  value: column.status,
  label: column.title,
}));

type KanbanTaskFormErrors = Partial<Record<keyof KanbanTaskFormValues, string>>;

type KanbanTaskFormProps = {
  /** "create" lets the user pick the starting status; "edit" shows it read-only (status changes by moving the card). */
  mode: KanbanTaskFormMode;
  initialValues: KanbanTaskFormValues;
  teamMembers: TeamMember[];
  mentionables: Mentionable[];
  /** False locks the owner field, for users who may not reassign this card (E4-1). */
  canChangeOwner?: boolean;
  submitLabel?: string;
  onSubmit: (values: KanbanTaskFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

function validateKanbanTaskForm(
  values: KanbanTaskFormValues,
  turnaroundAmountInput: string,
): KanbanTaskFormErrors {
  const formErrors: KanbanTaskFormErrors = {};
  const turnaroundAmount = Number(turnaroundAmountInput);

  if (!values.title.trim()) {
    formErrors.title = "Title is required.";
  }
  if (!values.ownerName) {
    formErrors.ownerName = "Choose an owner.";
  }
  if (!values.dueDate) {
    formErrors.dueDate = "Due date is required.";
  }
  if (!turnaroundAmountInput.trim() || !Number.isFinite(turnaroundAmount) || turnaroundAmount <= 0) {
    formErrors.estimatedTurnaround = "Enter an estimated turnaround greater than 0.";
  }
  if (!values.note.trim()) {
    formErrors.note = "A note is required.";
  }

  return formErrors;
}

/**
 * Create/edit form for a Kanban task. Not tied to a dialog, so it can be reused anywhere.
 * Owner, due date and estimated turnaround are required, so no card is saved without them
 * (E1-2, E2-1). Every save also needs a note, which goes into the audit log (E1-5).
 */
export default function KanbanTaskForm({
  mode,
  initialValues,
  teamMembers,
  mentionables,
  canChangeOwner = true,
  submitLabel = "Save changes",
  onSubmit,
  onCancel,
}: KanbanTaskFormProps) {
  const [formValues, setFormValues] = useState<KanbanTaskFormValues>(initialValues);
  const [turnaroundAmountInput, setTurnaroundAmountInput] = useState(
    initialValues.estimatedTurnaround.amount > 0 ? String(initialValues.estimatedTurnaround.amount) : "",
  );
  const [formErrors, setFormErrors] = useState<KanbanTaskFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateFormValue<FieldName extends keyof KanbanTaskFormValues>(
    fieldName: FieldName,
    fieldValue: KanbanTaskFormValues[FieldName],
  ) {
    setFormValues((previousFormValues) => ({ ...previousFormValues, [fieldName]: fieldValue }));
    setFormErrors((previousFormErrors) => ({ ...previousFormErrors, [fieldName]: undefined }));
  }

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedFormValues: KanbanTaskFormValues = {
      ...formValues,
      title: formValues.title.trim(),
      description: formValues.description.trim(),
      estimatedTurnaround: {
        amount: Number(turnaroundAmountInput),
        unit: formValues.estimatedTurnaround.unit,
      },
      note: formValues.note.trim(),
    };
    const validationErrors = validateKanbanTaskForm(trimmedFormValues, turnaroundAmountInput);

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedFormValues);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmitForm} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={Boolean(formErrors.title)}>
          <FieldLabel htmlFor="kanban-task-title">Title</FieldLabel>
          <Input
            id="kanban-task-title"
            value={formValues.title}
            onChange={(event) => updateFormValue("title", event.target.value)}
            aria-invalid={Boolean(formErrors.title)}
            autoFocus
          />
          <FieldError>{formErrors.title}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="kanban-task-description">Description</FieldLabel>
          <Textarea
            id="kanban-task-description"
            value={formValues.description}
            onChange={(event) => updateFormValue("description", event.target.value)}
            rows={3}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="kanban-task-status">Status</FieldLabel>
          <Select
            items={KANBAN_STATUS_OPTIONS}
            value={formValues.status}
            onValueChange={(status) => status && updateFormValue("status", status as KanbanStatus)}
            disabled={mode === "edit"}
          >
            <SelectTrigger id="kanban-task-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KANBAN_STATUS_OPTIONS.map((statusOption) => (
                <SelectItem key={statusOption.value} value={statusOption.value}>
                  {statusOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {mode === "edit" && (
            <FieldDescription>Move the card on the board to change its status.</FieldDescription>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={Boolean(formErrors.ownerName)}>
            <FieldLabel htmlFor="kanban-task-owner">Owner</FieldLabel>
            <Select
              value={formValues.ownerName}
              disabled={!canChangeOwner}
              onValueChange={(ownerName) => updateFormValue("ownerName", ownerName ?? "")}
            >
              <SelectTrigger
                id="kanban-task-owner"
                className="w-full"
                aria-invalid={Boolean(formErrors.ownerName)}
              >
                <SelectValue placeholder="Choose an owner" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((teamMember) => (
                  <SelectItem key={teamMember.id} value={teamMember.name}>
                    <UserAvatar name={teamMember.name} className="size-5" />
                    {teamMember.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!canChangeOwner && (
              <FieldDescription>Your role can&rsquo;t reassign this card.</FieldDescription>
            )}
            <FieldError>{formErrors.ownerName}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="kanban-task-priority">Priority</FieldLabel>
            <Select
              items={KANBAN_TASK_PRIORITY_OPTIONS}
              value={formValues.priority}
              onValueChange={(priority) =>
                priority && updateFormValue("priority", priority as KanbanTaskPriority)
              }
            >
              <SelectTrigger id="kanban-task-priority" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KANBAN_TASK_PRIORITY_OPTIONS.map((priorityOption) => (
                  <SelectItem key={priorityOption.value} value={priorityOption.value}>
                    {priorityOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={Boolean(formErrors.dueDate)}>
            <FieldLabel htmlFor="kanban-task-due-date">Due date</FieldLabel>
            <Input
              id="kanban-task-due-date"
              type="date"
              value={formValues.dueDate}
              onChange={(event) => updateFormValue("dueDate", event.target.value)}
              aria-invalid={Boolean(formErrors.dueDate)}
            />
            <FieldError>{formErrors.dueDate}</FieldError>
          </Field>

          <Field data-invalid={Boolean(formErrors.estimatedTurnaround)}>
            <FieldLabel htmlFor="kanban-task-turnaround">Estimated turnaround</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="kanban-task-turnaround"
                type="number"
                inputMode="decimal"
                min={0.5}
                step={0.5}
                value={turnaroundAmountInput}
                onChange={(event) => {
                  setTurnaroundAmountInput(event.target.value);
                  setFormErrors((previousFormErrors) => ({
                    ...previousFormErrors,
                    estimatedTurnaround: undefined,
                  }));
                }}
                aria-invalid={Boolean(formErrors.estimatedTurnaround)}
                className="min-w-0 flex-1"
              />
              <Select
                items={KANBAN_TURNAROUND_UNIT_OPTIONS}
                value={formValues.estimatedTurnaround.unit}
                onValueChange={(unit) =>
                  unit &&
                  updateFormValue("estimatedTurnaround", {
                    ...formValues.estimatedTurnaround,
                    unit: unit as KanbanTurnaroundUnit,
                  })
                }
              >
                <SelectTrigger aria-label="Turnaround unit" className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KANBAN_TURNAROUND_UNIT_OPTIONS.map((unitOption) => (
                    <SelectItem key={unitOption.value} value={unitOption.value}>
                      {unitOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FieldError>{formErrors.estimatedTurnaround}</FieldError>
          </Field>
        </div>

        <Field data-invalid={Boolean(formErrors.note)}>
          <FieldLabel htmlFor="kanban-task-note">
            {mode === "create" ? "Note" : "What changed and why?"}
          </FieldLabel>
          <MentionTextarea
            id="kanban-task-note"
            value={formValues.note}
            onChange={(noteValue) => updateFormValue("note", noteValue)}
            mentionables={mentionables}
            placeholder={
              mode === "create"
                ? "Context for the owner, e.g. why this is needed and the first step."
                : "e.g. Pushed the due date after the supplier delayed their quote."
            }
            aria-invalid={Boolean(formErrors.note)}
            rows={2}
          />
          <FieldDescription>
            Required. Type @ to mention someone. Saved to the audit log and shown on the card.
          </FieldDescription>
          <FieldError>{formErrors.note}</FieldError>
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2">
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
