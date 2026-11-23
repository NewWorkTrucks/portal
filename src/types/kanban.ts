import type { Dispatch, SetStateAction } from "react";
import type { KanbanAttachment } from "@/types/attachment";
import type { KanbanAuditLogEntry } from "@/types/audit-log";
import type {
  KanbanBlockerDetails,
  KanbanCompletionSummary,
  KanbanDailyUpdate,
  KanbanStageTransition,
  KanbanWaitingDetails,
} from "@/types/kanban-stages";
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
  /** The business this card belongs to; never shown outside it (E4-2). */
  businessId: string;
  title: string;
  description: string;
  status: KanbanStatus;
  ownerName: string;
  priority: KanbanTaskPriority;
  /** Optional when the card is created; null until someone sets it. */
  dueDate: string | null;
  /** Optional when the card is created; null until someone sets it (E2-1). */
  estimatedTurnaround: KanbanEstimatedTurnaround | null;
  latestNote: string;
  /** Order within the column (live mode); mock mode uses array order. */
  position?: number;
  attachments: KanbanAttachment[];
  /** How many times the card has been deferred (E2-8). */
  deferralCount: number;
  /** When the last daily update was posted (E2-3). Used for staleness checks later (E3-4). */
  lastDailyUpdateAt?: string;
  /** The workday this card missed its 6 PM Central update; cleared by the next update. */
  dailyUpdateMissedOn?: string;
  /** Needs Review: who was asked to review (E2-4). */
  reviewerName?: string;
  /** Waiting: what, who and when contacted (E2-6). */
  waitingDetails?: KanbanWaitingDetails;
  /** Waiting: when to follow up (E2-6). */
  followUpDate?: string;
  /** Stuck: the blocker (E2-7). */
  blockerDetails?: KanbanBlockerDetails;
  /** Deferred: when to revisit (E2-8). */
  revisitDate?: string;
  /** Done: the closing summary (E2-9). */
  completionSummary?: KanbanCompletionSummary;
};

export type KanbanTasksByStatus = Record<KanbanStatus, KanbanTask[]>;

export type ArchivedKanbanTask = KanbanTask & {
  archivedAt: string;
};

export type KanbanTaskFormValues = Pick<
  KanbanTask,
  "title" | "description" | "status" | "ownerName" | "priority" | "dueDate" | "estimatedTurnaround"
> & {
  /** Explanation for this change, recorded in the audit log and shown as the card's latest note. Required on edits, optional on create. */
  note: string;
};

/** Task fields an edit may change. Status is excluded: it only changes by moving the card. */
export type KanbanTaskEditableFields = Omit<KanbanTaskFormValues, "status" | "note">;

export type KanbanTaskFormMode = "create" | "edit";

export type KanbanTaskDialogKind = "create" | "edit" | "rename";

/** An operation that needs a note or stage form in a dialog before it is saved. */
export type KanbanPendingNoteOperation =
  | {
      kind: "move";
      task: KanbanTask;
      previousStatus: KanbanStatus;
      newStatus: KanbanStatus;
      /** Set for drags, where the card is already previewed in its new column; restored on cancel. */
      tasksBeforeMove: KanbanTasksByStatus | null;
    }
  | { kind: "daily-update"; task: KanbanTask }
  | { kind: "add-update"; task: KanbanTask }
  | { kind: "change-owner"; task: KanbanTask; newOwnerName: string }
  | { kind: "archive"; task: KanbanTask }
  | { kind: "attach-files"; task: KanbanTask; files: File[] }
  | { kind: "remove-attachment"; task: KanbanTask; attachment: KanbanAttachment };

/** Operations handled by the stage dialog (Epic 2 forms). */
export type KanbanStageOperation = Extract<KanbanPendingNoteOperation, { kind: "move" | "daily-update" }>;

/** Operations that only need a required note. */
export type KanbanNoteOnlyOperation = Exclude<KanbanPendingNoteOperation, KanbanStageOperation>;

export type KanbanTaskActions = {
  onOpenDetails: (task: KanbanTask) => void;
  onClickEdit: (task: KanbanTask) => void;
  onClickRename: (task: KanbanTask) => void;
  onClickArchive: (task: KanbanTask) => void;
  onSelectOwner: (task: KanbanTask, ownerName: string) => void;
  onClickDailyUpdate: (task: KanbanTask) => void;
  /** A progress note or comment on a card in any stage, without changing it. */
  onClickAddUpdate: (task: KanbanTask) => void;
  /** Reviewer actions for cards in Needs Review (E2-5). */
  onClickApprove: (task: KanbanTask) => void;
  onClickReturn: (task: KanbanTask) => void;
  onSelectAttachments: (task: KanbanTask, files: File[]) => void;
  onClickRemoveAttachment: (task: KanbanTask, attachment: KanbanAttachment) => void;
};

export type KanbanBoardContextValue = {
  teamMembers: TeamMember[];
  mentionables: Mentionable[];
  /** Cards of the current business only. */
  tasksByStatus: KanbanTasksByStatus;
  /** Every business's cards. Only for drag snapshots, so restoring one never drops other businesses' cards. */
  allTasksByStatus: KanbanTasksByStatus;
  archivedTasks: ArchivedKanbanTask[];
  auditLogEntries: readonly KanbanAuditLogEntry[];
  /** Live drag preview only. Committed changes go through the actions below so they are logged. */
  setTasksByStatus: Dispatch<SetStateAction<KanbanTasksByStatus>>;
  createTask: (formValues: KanbanTaskFormValues) => Promise<void>;
  updateTask: (task: KanbanTask, formValues: KanbanTaskFormValues) => Promise<void>;
  renameTask: (task: KanbanTask, title: string, note: string) => Promise<void>;
  changeTaskOwner: (task: KanbanTask, ownerName: string, note: string) => Promise<void>;
  archiveTask: (task: KanbanTask, note: string) => Promise<void>;
  /**
   * Moves a card into a new stage with that stage's required details. For drags the card is
   * already in its new column; for buttons (approve, return) this moves it.
   */
  transitionTask: (
    taskId: string,
    previousStatus: KanbanStatus,
    transition: KanbanStageTransition,
    files?: File[],
  ) => Promise<void>;
  /** Saves a card's new position within its column after a drag (live mode). */
  reorderTask: (taskId: string, orderedTaskIds: string[]) => Promise<void>;
  /** `files` are posted with the update and shown under it in the activity log (E1-4). */
  postDailyUpdate: (task: KanbanTask, dailyUpdate: KanbanDailyUpdate, files?: File[]) => Promise<void>;
  addTaskUpdate: (task: KanbanTask, note: string, files?: File[]) => Promise<void>;
  attachFiles: (task: KanbanTask, files: File[], note: string) => Promise<void>;
  removeAttachment: (task: KanbanTask, attachment: KanbanAttachment, note: string) => Promise<void>;
  /** What the current user may do with a card, based on their role and ownership (E4-1). */
  getTaskPermissions: (task: KanbanTask) => KanbanTaskPermissions;
  /** Why the current user may not move `task` to `newStatus`, or null if allowed. */
  getMoveDeniedReason: (task: KanbanTask, newStatus: KanbanStatus) => string | null;
};
