"use client";

import { Archive, ArrowRightLeft, type LucideIcon, UserRoundPen } from "lucide-react";
import type { ReactNode } from "react";
import KanbanOperationNoteForm from "@/components/forms/kanban-operation-note-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KANBAN_BOARD_NAME } from "@/constants/kanban-columns";
import { getColumnTitle } from "@/lib/kanban";
import type { KanbanPendingNoteOperation } from "@/types/kanban";

import type { Mentionable } from "@/types/mention";

type KanbanOperationNoteDialogProps = {
  /** Kept after the dialog closes so its content doesn't vanish during the exit animation. */
  operation: KanbanPendingNoteOperation | null;
  mentionables: Mentionable[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (note: string) => void | Promise<void>;
};

type OperationDialogCopy = {
  title: string;
  description: ReactNode;
  noteLabel: string;
  notePlaceholder: string;
  submitLabel: string;
  SubmitIcon: LucideIcon;
  submitVariant: "default" | "destructive";
};

function TaskTitle({ title }: { title: string }) {
  return <strong className="font-semibold text-foreground">“{title}”</strong>;
}

function getOperationDialogCopy(operation: KanbanPendingNoteOperation): OperationDialogCopy {
  switch (operation.kind) {
    case "move":
      return {
        title: `Move to ${getColumnTitle(operation.newStatus)}`,
        description: (
          <>
            <TaskTitle title={operation.task.title} /> is moving from{" "}
            {getColumnTitle(operation.previousStatus)} to {getColumnTitle(operation.newStatus)}.
          </>
        ),
        noteLabel: "Why is it moving?",
        notePlaceholder: "e.g. Started the checklist draft; first section done.",
        submitLabel: "Move task",
        SubmitIcon: ArrowRightLeft,
        submitVariant: "default",
      };
    case "change-owner":
      return {
        title: "Change ownership",
        description: (
          <>
            <TaskTitle title={operation.task.title} /> will be reassigned from{" "}
            {operation.task.ownerName} to {operation.newOwnerName}.
          </>
        ),
        noteLabel: "Why is it being reassigned?",
        notePlaceholder: "e.g. Edward is out this week; Miggy is taking over.",
        submitLabel: "Reassign",
        SubmitIcon: UserRoundPen,
        submitVariant: "default",
      };
    case "archive":
      return {
        title: "Archive this task?",
        description: (
          <>
            <TaskTitle title={operation.task.title} /> will be removed from the {KANBAN_BOARD_NAME}{" "}
            and archived. Its history stays in the audit log.
          </>
        ),
        noteLabel: "Why is it being archived?",
        notePlaceholder: "e.g. Duplicate of the onboarding guide task.",
        submitLabel: "Archive",
        SubmitIcon: Archive,
        submitVariant: "destructive",
      };
  }
}

/** One dialog for every board operation that has no form of its own; each one requires a note. */
export default function KanbanOperationNoteDialog({
  operation,
  mentionables,
  isOpen,
  onOpenChange,
  onConfirm,
}: KanbanOperationNoteDialogProps) {
  const operationDialogCopy = operation ? getOperationDialogCopy(operation) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        {operation && operationDialogCopy && (
          <>
            <DialogHeader>
              <DialogTitle>{operationDialogCopy.title}</DialogTitle>
              <DialogDescription>{operationDialogCopy.description}</DialogDescription>
            </DialogHeader>

            <KanbanOperationNoteForm
              key={`${operation.kind}-${operation.task.id}`}
              noteLabel={operationDialogCopy.noteLabel}
              notePlaceholder={operationDialogCopy.notePlaceholder}
              submitLabel={operationDialogCopy.submitLabel}
              SubmitIcon={operationDialogCopy.SubmitIcon}
              submitVariant={operationDialogCopy.submitVariant}
              onSubmit={onConfirm}
              mentionables={mentionables}
            onCancel={() => onOpenChange(false)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
