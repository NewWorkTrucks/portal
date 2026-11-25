import type { KanbanAuditLogEntry } from "@/types/audit-log";
import type { KanbanSubtaskProgress, KanbanTask } from "@/types/kanban";

export type KanbanSubtaskProgressProps = {
  subtaskProgress: KanbanSubtaskProgress;
  className?: string;
};

/** One thing done on a subtask today, for its parent's reviewer (US-5.3). */
export type KanbanSubtaskAccomplishment = {
  subtask: KanbanTask;
  auditLogEntry: KanbanAuditLogEntry;
};

export type KanbanSubtaskTodayProps = {
  subtasks: readonly KanbanTask[];
  onOpenTask: (task: KanbanTask) => void;
};
