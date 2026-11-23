import type { KanbanStatus } from "@/types/kanban";

export type MondayImportStatus = Extract<KanbanStatus, "not-started" | "working-on-it" | "needs-review" | "deferred" | "done">;

export type MondayBoardItem = {
  importKey: string;
  title: string;
  groupName: string;
  parentTitle: string | null;
  peopleNames: string[];
  mondayStatus: string;
  status: MondayImportStatus;
  /** True when the Monday status has no direct import path, so the card lands in a safe stage. */
  isStatusAdjusted: boolean;
  dueDate: string | null;
};

export type MondayBoard = {
  boardName: string;
  items: MondayBoardItem[];
};

export type MondayImportFormValues = {
  fallbackOwnerId: string;
  reviewerId: string;
  revisitDate: string;
};

export type MondayImportRequestItem = {
  importKey: string;
  title: string;
  description: string;
  status: MondayImportStatus;
  ownerId: string;
  dueDate: string | null;
  reviewerId: string | null;
  revisitDate: string | null;
};

export type MondayImportResult = {
  importedCount: number;
  skippedCount: number;
};
