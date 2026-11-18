import type { KanbanColumnDefinition } from "@/types/kanban";

export const KANBAN_COLUMNS: readonly KanbanColumnDefinition[] = [
  {
    status: "not-started",
    title: "Not Started",
    description: "Assigned, work has not begun",
    accentClassName: "bg-slate-400",
  },
  {
    status: "working-on-it",
    title: "Working on It",
    description: "Actively in progress",
    accentClassName: "bg-blue-500",
  },
  {
    status: "needs-review",
    title: "Needs Review",
    description: "Ready for validation",
    accentClassName: "bg-violet-500",
  },
  {
    status: "waiting",
    title: "Waiting",
    description: "Depends on another party",
    accentClassName: "bg-amber-500",
  },
  {
    status: "stuck",
    title: "Stuck",
    description: "Blocked, needs intervention",
    accentClassName: "bg-red-500",
  },
  {
    status: "deferred",
    title: "Deferred",
    description: "Postponed with approval",
    accentClassName: "bg-zinc-500",
  },
  {
    status: "done",
    title: "Done",
    description: "Reviewed and accepted",
    accentClassName: "bg-emerald-500",
  },
];

export const KANBAN_COLUMN_COUNT = KANBAN_COLUMNS.length;

export const KANBAN_BOARD_NAME = "Kanban Board";
