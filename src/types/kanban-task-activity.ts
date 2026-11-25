import type { ActivityReceipt } from "@/types/activity-receipt";
import type { KanbanAuditLogEntry } from "@/types/audit-log";
import type { KanbanTask } from "@/types/kanban";

export type KanbanTaskActivityTab = "updates" | "all";

export type KanbanTaskActivityProps = {
  task: KanbanTask;
  /** A parent card's subtasks: their activity shows in the parent's log too (US-5.2). */
  subtasks: readonly KanbanTask[];
  isOpen: boolean;
  onOpenTask: (task: KanbanTask) => void;
};

export type KanbanTaskActivityListProps = {
  task: KanbanTask;
  auditLogEntries: readonly KanbanAuditLogEntry[];
  emptyMessage: string;
  /** Shown as threads under each update. Left out for the flat All activity log. */
  commentsByUpdateId?: ReadonlyMap<string, KanbanAuditLogEntry[]>;
  canComment?: boolean;
  receiptsByActivityId: ReadonlyMap<string, ActivityReceipt[]>;
  unseenActivityIds: ReadonlySet<string>;
  onSeen: (activityId: string) => void;
  /** Subtasks whose entries are mixed into a parent's log, by id. */
  subtaskById: ReadonlyMap<string, KanbanTask>;
  onOpenTask: (task: KanbanTask) => void;
};

export type KanbanTaskActivityEntryProps = Pick<
  KanbanTaskActivityListProps,
  "task" | "receiptsByActivityId" | "unseenActivityIds" | "onSeen" | "subtaskById" | "onOpenTask"
> & {
  auditLogEntry: KanbanAuditLogEntry;
};
