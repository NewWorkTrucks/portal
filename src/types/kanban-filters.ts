import type { KanbanStatus, KanbanTaskPriority } from "@/types/kanban";

export type KanbanDueDateFilter = "any" | "overdue" | "due-today" | "due-next-7-days";

/** E1-6: what the board is filtered by. Empty lists mean "any". */
export type KanbanTaskFilters = {
  searchText: string;
  ownerNames: string[];
  /** The board's stages are its statuses, so this covers both "stage" and "status" in E1-6. */
  statuses: KanbanStatus[];
  priorities: KanbanTaskPriority[];
  dueDate: KanbanDueDateFilter;
};
