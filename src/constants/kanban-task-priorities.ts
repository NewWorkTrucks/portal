import type { KanbanTaskPriority, KanbanTurnaroundUnit } from "@/types/kanban";

export const KANBAN_TASK_PRIORITY_OPTIONS: { value: KanbanTaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const KANBAN_PRIORITY_BADGE_CLASS_NAMES: Record<KanbanTaskPriority, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export const KANBAN_TURNAROUND_UNIT_OPTIONS: { value: KanbanTurnaroundUnit; label: string }[] = [
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
];
