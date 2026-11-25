"use client";

import {
  Archive,
  FileMinus,
  type LucideIcon,
  MessageSquarePlus,
  Paperclip,
  UserRoundPen,
} from "lucide-react";
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
import { formatFileSize } from "@/lib/kanban-stages";
import type { KanbanNoteOnlyOperation } from "@/types/kanban";

import type { Mentionable } from "@/types/mention";

type KanbanOperationNoteDialogProps = {
  /** Kept after the dialog closes so its content doesn't vanish during the exit animation. */
  operation: KanbanNoteOnlyOperation | null;
  mentionables: Mentionable[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Whether the current user may attach files to this card (owner, department head, admin). */
  canAttachFiles: boolean;
  onConfirm: (note: string, files: File[]) => void | Promise<void>;
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

function getOperationDialogCopy(operation: KanbanNoteOnlyOperation): OperationDialogCopy {
  switch (operation.kind) {
    case "add-update":
      return {
        title: "Add update",
        description: (
          <>
            Post a progress note or comment on <TaskTitle title={operation.task.title} />. It
            becomes the card&rsquo;s latest note.
          </>
        ),
        noteLabel: "Update",
        notePlaceholder: "e.g. Supplier confirmed by phone; written quote expected Friday. @Morgan FYI",
        submitLabel: "Post update",
        SubmitIcon: MessageSquarePlus,
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
        notePlaceholder: "e.g. Sam is out this week; Morgan is taking over.",
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
    case "attach-files":
      return {
        title: `Attach ${operation.files.length} file${operation.files.length === 1 ? "" : "s"}`,
        description: (
          <>
            Adding {operation.files.map((file) => `${file.name} (${formatFileSize(file.size)})`).join(", ")} to{" "}
            <TaskTitle title={operation.task.title} />.
          </>
        ),
        noteLabel: "What are these files?",
        notePlaceholder: "e.g. Signed supplier quote, as evidence for the order.",
        submitLabel: "Attach",
        SubmitIcon: Paperclip,
        submitVariant: "default",
      };
    case "remove-attachment":
      return {
        title: "Remove attachment?",
        description: (
          <>
            {operation.attachment.fileName} will be removed from <TaskTitle title={operation.task.title} />.
            The removal stays in the audit log.
          </>
        ),
        noteLabel: "Why remove it?",
        notePlaceholder: "e.g. Uploaded the wrong version.",
        submitLabel: "Remove",
        SubmitIcon: FileMinus,
        submitVariant: "destructive",
      };
  }
}

/** One dialog for operations that only need a note: updates, reassign, archive and attachments. */
export default function KanbanOperationNoteDialog({
  operation,
  mentionables,
  isOpen,
  onOpenChange,
  canAttachFiles,
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
              // Files go with updates; reassigning, archiving and attachment changes stay note-only.
              canAttachFiles={operation.kind === "add-update" && canAttachFiles}
              mentionables={mentionables}
            onCancel={() => onOpenChange(false)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
