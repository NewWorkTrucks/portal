import type { Dispatch, SetStateAction } from "react";
import type { KanbanAuditLogEntry } from "@/types/audit-log";
import type { Mentionable } from "@/types/mention";
import type { KanbanTaskPermissions } from "@/types/roles";
import type { TeamMember } from "@/types/team";

export type KanbanStatus =
  | "not-started"
  | "working-on-it"
  | "needs-review"
  | "waiting"
  | "stuck"
  | "deferred"
  | "done";

export type KanbanTaskPriority = "low" | "medium" | "high";

export type KanbanTurnaroundUnit = "hours" | "days";

/** How long the owner expects the work to take, set when the task is assigned (E2-1). */
export type KanbanEstimatedTurnaround = {
  amount: number;
  unit: KanbanTurnaroundUnit;
};

export type KanbanColumnDefinition = {
  status: KanbanStatus;
  title: string;
  description: string;
  accentClassName: string;
};

export type KanbanTask = {
  id: string;
  title: string;
  description: string;
  status: KanbanStatus;
  ownerName: string;
  priority: KanbanTaskPriority;
  dueDate: string;
  estimatedTurnaround: KanbanEstimatedTurnaround;
  latestNote: string;
  followUpDate?: string;
  revisitDate?: string;
};

export type KanbanTasksByStatus = Record<KanbanStatus, KanbanTask[]>;

export type ArchivedKanbanTask = KanbanTask & {
  archivedAt: string;
};

export type KanbanTaskFormValues = Pick<
  KanbanTask,
  "title" | "description" | "status" | "ownerName" | "priority" | "dueDate" | "estimatedTurnaround"
> & {
  /** Required explanation for this change; recorded in the audit log and shown as the card's latest note. */
  note: string;
};

/** Task fields an edit may change. Status is excluded: it only changes by moving the card. */
export type KanbanTaskEditableFields = Omit<KanbanTaskFormValues, "status" | "note">;

export type KanbanTaskFormMode = "create" | "edit";

export type KanbanTaskDialogKind = "create" | "edit" | "rename";

/** An operation that has no form of its own, so it asks for a required note in a dialog first. */
export type KanbanPendingNoteOperation =
  | {
      kind: "move";
      task: KanbanTask;
      previousStatus: KanbanStatus;
      newStatus: KanbanStatus;
      tasksBeforeMove: KanbanTasksByStatus;
    }
  | { kind: "change-owner"; task: KanbanTask; newOwnerName: string }
  | { kind: "archive"; task: KanbanTask };

export type KanbanTaskActions = {
  onClickEdit: (task: KanbanTask) => void;
  onClickRename: (task: KanbanTask) => void;
  onClickArchive: (task: KanbanTask) => void;
  onSelectOwner: (task: KanbanTask, ownerName: string) => void;
};

export type KanbanBoardContextValue = {
  teamMembers: TeamMember[];
  mentionables: Mentionable[];
  tasksByStatus: KanbanTasksByStatus;
  archivedTasks: ArchivedKanbanTask[];
  auditLogEntries: readonly KanbanAuditLogEntry[];
  /** Live drag preview only. Committed changes go through the actions below so they are logged. */
  setTasksByStatus: Dispatch<SetStateAction<KanbanTasksByStatus>>;
  createTask: (formValues: KanbanTaskFormValues) => Promise<void>;
  updateTask: (task: KanbanTask, formValues: KanbanTaskFormValues) => Promise<void>;
  renameTask: (task: KanbanTask, title: string, note: string) => Promise<void>;
  changeTaskOwner: (task: KanbanTask, ownerName: string, note: string) => Promise<void>;
  archiveTask: (task: KanbanTask, note: string) => Promise<void>;
  commitTaskMove: (taskId: string, previousStatus: KanbanStatus, note: string) => Promise<void>;
  /** What the current user may do with a card, based on their role and ownership (E4-1). */
  getTaskPermissions: (task: KanbanTask) => KanbanTaskPermissions;
  /** Why the current user may not move `task` to `newStatus`, or null if allowed. */
  getMoveDeniedReason: (task: KanbanTask, newStatus: KanbanStatus) => string | null;
};
