import { getTodayIsoDate } from "@/lib/kanban";
import type { KanbanTask, KanbanTasksByStatus } from "@/types/kanban";
import type { KanbanDueDateFilter, KanbanTaskFilters } from "@/types/kanban-filters";

function addDaysToIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function matchesDueDateFilter(task: KanbanTask, dueDateFilter: KanbanDueDateFilter, todayIsoDate: string) {
  if (dueDateFilter === "any") {
    return true;
  }
  // A card without a due date isn't overdue or due soon.
  if (!task.dueDate) {
    return false;
  }
  switch (dueDateFilter) {
    case "overdue":
      // Finished work isn't overdue.
      return task.status !== "done" && task.dueDate < todayIsoDate;
    case "due-today":
      return task.dueDate === todayIsoDate;
    case "due-next-7-days":
      return task.dueDate >= todayIsoDate && task.dueDate <= addDaysToIsoDate(todayIsoDate, 7);
  }
}

export function matchesKanbanTaskFilters(
  task: KanbanTask,
  filters: KanbanTaskFilters,
  todayIsoDate: string,
): boolean {
  const normalizedSearchText = filters.searchText.trim().toLowerCase();
  const matchesSearchText =
    !normalizedSearchText ||
    [task.title, task.description, task.latestNote].some((text) =>
      text.toLowerCase().includes(normalizedSearchText),
    );

  return (
    matchesSearchText &&
    (filters.ownerNames.length === 0 || filters.ownerNames.includes(task.ownerName)) &&
    (filters.statuses.length === 0 || filters.statuses.includes(task.status)) &&
    (filters.priorities.length === 0 || filters.priorities.includes(task.priority)) &&
    matchesDueDateFilter(task, filters.dueDate, todayIsoDate)
  );
}

/**
 * The board's cards that match the filters, still grouped by column.
 * TODO: Filter on the server once cards come from the backend (E1-6: under 2 s for 5,000 cards).
 */
export function filterKanbanTasksByStatus(
  tasksByStatus: KanbanTasksByStatus,
  filters: KanbanTaskFilters,
): KanbanTasksByStatus {
  // Only read the clock when a due-date filter needs it: the board is prerendered, and
  // cacheComponents forbids `new Date()` during prerender. The default filter is "any".
  const todayIsoDate = filters.dueDate === "any" ? "" : getTodayIsoDate();

  return Object.fromEntries(
    Object.entries(tasksByStatus).map(([status, tasks]) => [
      status,
      tasks.filter((task) => matchesKanbanTaskFilters(task, filters, todayIsoDate)),
    ]),
  ) as KanbanTasksByStatus;
}

export function countActiveKanbanTaskFilters(filters: KanbanTaskFilters): number {
  return [
    filters.searchText.trim() !== "",
    filters.ownerNames.length > 0,
    filters.statuses.length > 0,
    filters.priorities.length > 0,
    filters.dueDate !== "any",
  ].filter(Boolean).length;
}

export function toggleListValue<ListValue>(list: ListValue[], value: ListValue): ListValue[] {
  return list.includes(value) ? list.filter((listValue) => listValue !== value) : [...list, value];
}
