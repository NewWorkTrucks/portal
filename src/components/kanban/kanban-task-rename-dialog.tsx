"use client";

import KanbanTaskRenameForm from "@/components/forms/kanban-task-rename-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { KanbanTask } from "@/types/kanban";

import type { Mentionable } from "@/types/mention";

type KanbanTaskRenameDialogProps = {
  task: KanbanTask | null;
  mentionables: Mentionable[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (title: string, note: string) => void | Promise<void>;
};

export default function KanbanTaskRenameDialog({
  task,
  mentionables,
  isOpen,
  onOpenChange,
  onSubmit,
}: KanbanTaskRenameDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename task</DialogTitle>
          <DialogDescription>Enter a new title for this Kanban item.</DialogDescription>
        </DialogHeader>

        {task && (
          <KanbanTaskRenameForm
            key={task.id}
            initialTitle={task.title}
            onSubmit={onSubmit}
            mentionables={mentionables}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
