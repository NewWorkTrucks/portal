import type { ActivityReceipt } from "@/types/activity-receipt";
import type { KanbanAuditLogEntry } from "@/types/audit-log";
import type { KanbanTask } from "@/types/kanban";

export type KanbanTaskActivityTab = "updates" | "all";

export type KanbanTaskActivityProps = {
  task: KanbanTask;
  isOpen: boolean;
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
};

export type KanbanTaskActivityEntryProps = Pick<
  KanbanTaskActivityListProps,
  "task" | "receiptsByActivityId" | "unseenActivityIds" | "onSeen"
> & {
  auditLogEntry: KanbanAuditLogEntry;
};
