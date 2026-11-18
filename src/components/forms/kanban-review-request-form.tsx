"use client";

import { type FormEvent, useState } from "react";
import MentionTextarea from "@/components/mention-textarea";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UserAvatar from "@/components/user-avatar";
import type { KanbanReviewRequestValues } from "@/types/kanban-stages";
import type { Mentionable } from "@/types/mention";
import type { TeamMember } from "@/types/team";

type KanbanReviewRequestFormProps = {
  reviewerOptions: TeamMember[];
  mentionables: Mentionable[];
  onSubmit: (values: KanbanReviewRequestValues) => void | Promise<void>;
  onCancel?: () => void;
};

/** E2-4: submitting work for review needs a reviewer, who is mentioned on the request. */
export default function KanbanReviewRequestForm({
  reviewerOptions,
  mentionables,
  onSubmit,
  onCancel,
}: KanbanReviewRequestFormProps) {
  const [reviewerName, setReviewerName] = useState("");
  const [note, setNote] = useState("");
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof KanbanReviewRequestValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors: Partial<Record<keyof KanbanReviewRequestValues, string>> = {};
    if (!reviewerName) {
      validationErrors.reviewerName = "Pick a reviewer.";
    }
    if (!note.trim()) {
      validationErrors.note = "A note is required.";
    }
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ reviewerName, note: note.trim() });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmitForm} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={Boolean(formErrors.reviewerName)}>
          <FieldLabel htmlFor="kanban-review-reviewer">Reviewer</FieldLabel>
          <Select
            value={reviewerName}
            onValueChange={(selectedReviewerName) => {
              setReviewerName(selectedReviewerName ?? "");
              setFormErrors((previousErrors) => ({ ...previousErrors, reviewerName: undefined }));
            }}
          >
            <SelectTrigger
              id="kanban-review-reviewer"
              className="w-full"
              aria-invalid={Boolean(formErrors.reviewerName)}
            >
              <SelectValue placeholder="Choose a reviewer" />
            </SelectTrigger>
            <SelectContent>
              {reviewerOptions.map((reviewer) => (
                <SelectItem key={reviewer.id} value={reviewer.name}>
                  <UserAvatar name={reviewer.name} className="size-5" />
                  {reviewer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>They&rsquo;ll be mentioned on the review request.</FieldDescription>
          <FieldError>{formErrors.reviewerName}</FieldError>
        </Field>

        <Field data-invalid={Boolean(formErrors.note)}>
          <FieldLabel htmlFor="kanban-review-note">What should they check?</FieldLabel>
          <MentionTextarea
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

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          Request review
        </Button>
      </div>
    </form>
  );
}
