"use client";

import KanbanTaskForm from "@/components/forms/kanban-task-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { KanbanTaskFormValues } from "@/types/kanban";
import type { Mentionable } from "@/types/mention";
import type { TeamMember } from "@/types/team";

const EMPTY_TASK_FORM_VALUES: KanbanTaskFormValues = {
  title: "",
  description: "",
  status: "not-started",
  ownerName: "",
  priority: "medium",
  dueDate: null,
  estimatedTurnaround: null,
  note: "",
};

type KanbanTaskCreateDialogProps = {
  teamMembers: TeamMember[];
  mentionables: Mentionable[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: KanbanTaskFormValues) => void | Promise<void>;
};

export default function KanbanTaskCreateDialog({
  teamMembers,
  mentionables,
  isOpen,
  onOpenChange,
  onSubmit,
}: KanbanTaskCreateDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>
            A task needs a title and an owner. The rest can be added later.
          </DialogDescription>
        </DialogHeader>

        <KanbanTaskForm
          mode="create"
          initialValues={EMPTY_TASK_FORM_VALUES}
          teamMembers={teamMembers}
          submitLabel="Create task"
          onSubmit={onSubmit}
          mentionables={mentionables}
            onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
