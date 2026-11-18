import { CalendarClock, CalendarDays, CalendarRange, CalendarX2, type LucideIcon } from "lucide-react";
import type { KanbanDueDateFilter, KanbanTaskFilters } from "@/types/kanban-filters";

export const EMPTY_KANBAN_TASK_FILTERS: KanbanTaskFilters = {
  searchText: "",
  ownerNames: [],
  statuses: [],
  priorities: [],
  dueDate: "any",
};

export const KANBAN_DUE_DATE_FILTER_OPTIONS: {
  value: KanbanDueDateFilter;
  label: string;
  Icon: LucideIcon;
}[] = [
  { value: "any", label: "Any due date", Icon: CalendarDays },
  { value: "overdue", label: "Overdue", Icon: CalendarX2 },
  { value: "due-today", label: "Due today", Icon: CalendarClock },
  { value: "due-next-7-days", label: "Due in the next 7 days", Icon: CalendarRange },
];
