"use client";

import { BellRing } from "lucide-react";
import { type FormEvent, useState } from "react";
import MentionTextarea from "@/components/mention-textarea";
import TurnaroundInput from "@/components/turnaround-input";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getTodayIsoDate, parseTurnaroundAmount } from "@/lib/kanban";
import type { KanbanEstimatedTurnaround } from "@/types/kanban";
import type { KanbanDeferralValues } from "@/types/kanban-stages";
import type { Mentionable } from "@/types/mention";

type KanbanDeferralFormProps = {
  initialTurnaround: KanbanEstimatedTurnaround;
  /** E2-2: deferring a card that hasn't started also notifies Leadership. */
  isCantStartDeferral: boolean;
  previousDeferralCount: number;
  mentionables: Mentionable[];
  onSubmit: (values: KanbanDeferralValues) => void | Promise<void>;
  onCancel?: () => void;
};

type KanbanDeferralErrors = Partial<Record<"reason" | "estimatedTurnaround" | "revisitDate", string>>;

/** E2-2 / E2-8: deferring needs a reason, a new turnaround and a revisit date. */
export default function KanbanDeferralForm({
  initialTurnaround,
  isCantStartDeferral,
  previousDeferralCount,
  mentionables,
  onSubmit,
  onCancel,
}: KanbanDeferralFormProps) {
  const [reason, setReason] = useState("");
  const [turnaroundAmountInput, setTurnaroundAmountInput] = useState(String(initialTurnaround.amount));
  const [turnaroundUnit, setTurnaroundUnit] = useState(initialTurnaround.unit);
  const [revisitDate, setRevisitDate] = useState("");
  const [formErrors, setFormErrors] = useState<KanbanDeferralErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const turnaroundAmount = parseTurnaroundAmount(turnaroundAmountInput);
    const validationErrors: KanbanDeferralErrors = {};
    if (!reason.trim()) {
      validationErrors.reason = isCantStartDeferral
        ? "Explain why the work can't start."
        : "Give a business reason for deferring.";
    }
    if (turnaroundAmount === null) {
      validationErrors.estimatedTurnaround = "Enter a new turnaround greater than 0.";
    }
    if (!revisitDate) {
      validationErrors.revisitDate = "Enter a revisit date.";
    } else if (revisitDate <= getTodayIsoDate()) {
      validationErrors.revisitDate = "Pick a date after today.";
    }
    if (Object.keys(validationErrors).length > 0 || turnaroundAmount === null) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        reason: reason.trim(),
        estimatedTurnaround: { amount: turnaroundAmount, unit: turnaroundUnit },
        revisitDate,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmitForm} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={Boolean(formErrors.reason)}>
          <FieldLabel htmlFor="kanban-deferral-reason">
            {isCantStartDeferral ? "Why can't this start?" : "Why defer it?"}
          </FieldLabel>
          <MentionTextarea
            id="kanban-deferral-reason"
            value={reason}
            onChange={(reasonValue) => {
              setReason(reasonValue);
              setFormErrors((previousErrors) => ({ ...previousErrors, reason: undefined }));
            }}
            mentionables={mentionables}
            placeholder="e.g. Waiting on Phase 1 policy controls before this integration."
            aria-invalid={Boolean(formErrors.reason)}
            rows={3}
            autoFocus
          />
          <FieldError>{formErrors.reason}</FieldError>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={Boolean(formErrors.estimatedTurnaround)}>
            <FieldLabel htmlFor="kanban-deferral-turnaround">New turnaround</FieldLabel>
            <TurnaroundInput
              id="kanban-deferral-turnaround"
              amountInput={turnaroundAmountInput}
              unit={turnaroundUnit}
              onChangeAmountInput={(amountInput) => {
                setTurnaroundAmountInput(amountInput);
                setFormErrors((previousErrors) => ({ ...previousErrors, estimatedTurnaround: undefined }));
              }}
              onChangeUnit={setTurnaroundUnit}
              aria-invalid={Boolean(formErrors.estimatedTurnaround)}
            />
            <FieldError>{formErrors.estimatedTurnaround}</FieldError>
          </Field>

          <Field data-invalid={Boolean(formErrors.revisitDate)}>
            <FieldLabel htmlFor="kanban-deferral-revisit">Revisit date</FieldLabel>
            <Input
              id="kanban-deferral-revisit"
              type="date"
              value={revisitDate}
              onChange={(event) => {
                setRevisitDate(event.target.value);
                setFormErrors((previousErrors) => ({ ...previousErrors, revisitDate: undefined }));
              }}
              aria-invalid={Boolean(formErrors.revisitDate)}
            />
            <FieldError>{formErrors.revisitDate}</FieldError>
          </Field>
        </div>
        <FieldDescription>
          A reminder is scheduled for the revisit date.
          {previousDeferralCount > 0 &&
            ` This card has been deferred ${previousDeferralCount} time${previousDeferralCount === 1 ? "" : "s"} before.`}
        </FieldDescription>
      </FieldGroup>

      {isCantStartDeferral && (
        <p className="flex items-start gap-2 rounded-md bg-amber-100 px-3 py-2 text-xs text-amber-900 dark:bg-amber-400/15 dark:text-amber-100">
          <BellRing aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          Deferring a card that hasn&rsquo;t started notifies @Leadership.
        </p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          Defer
        </Button>
      </div>
    </form>
  );
}
