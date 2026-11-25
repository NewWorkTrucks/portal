"use client";

import KanbanTaskForm from "@/components/forms/kanban-task-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { KanbanTask, KanbanTaskFormValues } from "@/types/kanban";
import type { Mentionable } from "@/types/mention";
import type { TeamMember } from "@/types/team";

type KanbanTaskEditDialogProps = {
  task: KanbanTask | null;
  teamMembers: TeamMember[];
  mentionables: Mentionable[];
  canChangeOwner: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: KanbanTaskFormValues) => void | Promise<void>;
};

export default function KanbanTaskEditDialog({
  task,
  teamMembers,
  mentionables,
  canChangeOwner,
  isOpen,
  onOpenChange,
  onSubmit,
}: KanbanTaskEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>Update the details of this Kanban item.</DialogDescription>
        </DialogHeader>

        {task && (
          <KanbanTaskForm
            key={task.id}
            mode="edit"
            canChangeOwner={canChangeOwner}
            initialValues={{
              title: task.title,
              description: task.description,
              status: task.status,
              ownerName: task.ownerName,
              priority: task.priority,
              dueDate: task.dueDate,
              estimatedTurnaround: task.estimatedTurnaround,
              note: "",
              recurrence: task.recurrence ? { rule: task.recurrence.rule, time: task.recurrence.time } : undefined,
            }}
            teamMembers={teamMembers}
            onSubmit={onSubmit}
            mentionables={mentionables}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
