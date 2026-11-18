import type { KanbanTaskPriority, KanbanTurnaroundUnit } from "@/types/kanban";

export const KANBAN_TASK_PRIORITY_OPTIONS: { value: KanbanTaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const KANBAN_TURNAROUND_UNIT_OPTIONS: { value: KanbanTurnaroundUnit; label: string }[] = [
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
];
