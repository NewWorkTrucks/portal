"use client";

import { FileUp } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserAvatar from "@/components/user-avatar";
import { MONDAY_IMPORT_STATUS_LABELS } from "@/constants/monday-import";
import { findMondayItemOwner, formatCardCount, getUnmatchedMondayPeople } from "@/lib/monday-import/monday-board";
import type { MondayBoard, MondayImportFormValues } from "@/types/monday-import";
import type { TeamMember } from "@/types/team";

const REVIEWER_ROLES = ["reviewer", "department_head", "admin"];

type MondayImportFormErrors = Partial<Record<keyof MondayImportFormValues, string>>;

type MondayImportFormProps = {
  mondayBoard: MondayBoard;
  businessMembers: TeamMember[];
  initialValues: MondayImportFormValues;
  isImportAvailable: boolean;
  onSubmit: (formValues: MondayImportFormValues) => Promise<void>;
  onCancel: () => void;
};

/** Reviews a parsed Monday board and collects what the file can't provide. */
export default function MondayImportForm({
  mondayBoard,
  businessMembers,
  initialValues,
  isImportAvailable,
  onSubmit,
  onCancel,
}: MondayImportFormProps) {
  const [formValues, setFormValues] = useState(initialValues);
  const [formErrors, setFormErrors] = useState<MondayImportFormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unmatchedPeople = useMemo(
    () => getUnmatchedMondayPeople(mondayBoard.items, businessMembers),
    [mondayBoard.items, businessMembers],
  );
  const reviewerOptions = useMemo(
    () => businessMembers.filter((teamMember) => REVIEWER_ROLES.includes(teamMember.role)),
    [businessMembers],
  );
  const hasCardsWithoutOwner = mondayBoard.items.some((boardItem) => !findMondayItemOwner(boardItem, businessMembers));
  const hasNeedsReviewCards = mondayBoard.items.some((boardItem) => boardItem.status === "needs-review");
  const hasDeferredCards = mondayBoard.items.some((boardItem) => boardItem.status === "deferred");
  const adjustedStatusCount = mondayBoard.items.filter((boardItem) => boardItem.isStatusAdjusted).length;
  const ownerItems = businessMembers.map((teamMember) => ({ value: teamMember.id, label: teamMember.name }));
  const reviewerItems = reviewerOptions.map((teamMember) => ({ value: teamMember.id, label: teamMember.name }));

  function updateFormValue(fieldName: keyof MondayImportFormValues, value: string) {
    setFormValues((previousFormValues) => ({ ...previousFormValues, [fieldName]: value }));
    setFormErrors((previousFormErrors) => ({ ...previousFormErrors, [fieldName]: undefined }));
    setSaveError(null);
  }

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors: MondayImportFormErrors = {};
    if (hasCardsWithoutOwner && !formValues.fallbackOwnerId) {
      validationErrors.fallbackOwnerId = "Choose who owns cards with no portal account.";
    }
    if (hasNeedsReviewCards && !formValues.reviewerId) {
      validationErrors.reviewerId = "Choose a reviewer for Needs Review cards.";
    } else if (
      mondayBoard.items.some(
        (boardItem) =>
          boardItem.status === "needs-review" &&
          (findMondayItemOwner(boardItem, businessMembers)?.id ?? formValues.fallbackOwnerId) === formValues.reviewerId,
      )
    ) {
      validationErrors.reviewerId = "This person owns a Needs Review card. Choose someone else to review.";
    }
    if (hasDeferredCards && !formValues.revisitDate) {
      validationErrors.revisitDate = "Choose when to revisit Deferred cards.";
    }
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formValues);
    } catch (submitError) {
      setSaveError(submitError instanceof Error ? submitError.message : "Couldn't import the board.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmitForm} noValidate className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium">{mondayBoard.boardName}</p>
        <p className="text-sm text-muted-foreground">
          {formatCardCount(mondayBoard.items.length)} found. Cards already imported will be skipped.
        </p>
      </div>

      {unmatchedPeople.length > 0 && (
        <p className="rounded-md border p-3 text-sm text-muted-foreground">
          No portal account in this business: {unmatchedPeople.join(", ")}. Their names stay on each card&rsquo;s description.
        </p>
      )}
      {adjustedStatusCount > 0 && (
        <p className="rounded-md border p-3 text-sm text-muted-foreground">
          {formatCardCount(adjustedStatusCount)} with a Monday status that needs extra details will start in an active stage.
        </p>
      )}

      <FieldGroup className="grid gap-4 sm:grid-cols-3">
        {hasCardsWithoutOwner && (
          <Field data-invalid={Boolean(formErrors.fallbackOwnerId)}>
            <FieldLabel htmlFor="monday-import-fallback-owner">Owner when unmatched</FieldLabel>
            <Select
              items={ownerItems}
              value={formValues.fallbackOwnerId || null}
              onValueChange={(ownerId) => updateFormValue("fallbackOwnerId", (ownerId as string | null) ?? "")}
            >
              <SelectTrigger id="monday-import-fallback-owner" className="w-full">
                <SelectValue placeholder="Choose owner" />
              </SelectTrigger>
              <SelectContent>
                {businessMembers.map((teamMember) => (
                  <SelectItem key={teamMember.id} value={teamMember.id}>
                    <UserAvatar name={teamMember.name} className="size-5" />
                    {teamMember.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{formErrors.fallbackOwnerId}</FieldError>
          </Field>
        )}

        {hasNeedsReviewCards && (
          <Field data-invalid={Boolean(formErrors.reviewerId)}>
            <FieldLabel htmlFor="monday-import-reviewer">Reviewer</FieldLabel>
            <Select
              items={reviewerItems}
              value={formValues.reviewerId || null}
              onValueChange={(reviewerId) => updateFormValue("reviewerId", (reviewerId as string | null) ?? "")}
            >
              <SelectTrigger id="monday-import-reviewer" className="w-full">
                <SelectValue placeholder="Choose reviewer" />
              </SelectTrigger>
              <SelectContent>
                {reviewerOptions.map((teamMember) => (
                  <SelectItem key={teamMember.id} value={teamMember.id}>
                    <UserAvatar name={teamMember.name} className="size-5" />
                    {teamMember.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>For Needs Review cards.</FieldDescription>
            <FieldError>{formErrors.reviewerId}</FieldError>
          </Field>
        )}

        {hasDeferredCards && (
          <Field data-invalid={Boolean(formErrors.revisitDate)}>
            <FieldLabel htmlFor="monday-import-revisit-date">Revisit date</FieldLabel>
            <Input
              id="monday-import-revisit-date"
              type="date"
              value={formValues.revisitDate}
              onChange={(event) => updateFormValue("revisitDate", event.target.value)}
              aria-invalid={Boolean(formErrors.revisitDate)}
            />
            <FieldDescription>For Deferred cards.</FieldDescription>
            <FieldError>{formErrors.revisitDate}</FieldError>
          </Field>
        )}
      </FieldGroup>

      <div className="max-h-96 overflow-auto rounded-md border">
        <table className="w-full min-w-xl text-left text-sm">
          <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Card</th>
              <th scope="col" className="px-3 py-2 font-medium">Stage</th>
              <th scope="col" className="px-3 py-2 font-medium">Owner</th>
              <th scope="col" className="px-3 py-2 font-medium">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {mondayBoard.items.map((boardItem) => (
              <tr key={boardItem.importKey}>
                <td className="px-3 py-2">
                  <span className="block font-medium">{boardItem.title}</span>
                  {boardItem.parentTitle && (
                    <span className="block text-xs text-muted-foreground">Subitem of {boardItem.parentTitle}</span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{MONDAY_IMPORT_STATUS_LABELS[boardItem.status]}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {findMondayItemOwner(boardItem, businessMembers)?.name ?? "Unmatched"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{boardItem.dueDate ?? "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isImportAvailable && (
        <p className="text-sm text-muted-foreground">Switch to live data to import. Preview works in sample mode.</p>
      )}

      <div className="flex items-center justify-end gap-2">
        {saveError && (
          <p role="alert" className="mr-auto text-sm text-destructive">
            {saveError}
          </p>
        )}
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !isImportAvailable}>
          <FileUp aria-hidden />
          {isSubmitting ? "Importing…" : `Import ${formatCardCount(mondayBoard.items.length)}`}
        </Button>
      </div>
    </form>
  );
}
