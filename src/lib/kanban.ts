import { arrayMove } from "@dnd-kit/sortable";
import { KANBAN_COLUMNS } from "@/constants/kanban-columns";
import { WORKDAY_TIME_ZONE } from "@/constants/time-zone";
import type {
  KanbanEstimatedTurnaround,
  KanbanStatus,
  KanbanTask,
  KanbanTasksByStatus,
} from "@/types/kanban";

const KANBAN_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function groupTasksByStatus(tasks: KanbanTask[]): KanbanTasksByStatus {
  const tasksByStatus = Object.fromEntries(
    KANBAN_COLUMNS.map((column) => [column.status, [] as KanbanTask[]]),
  ) as KanbanTasksByStatus;

  for (const task of tasks) {
    tasksByStatus[task.status].push(task);
  }

  return tasksByStatus;
}

function isKanbanStatus(draggableId: string): draggableId is KanbanStatus {
  return KANBAN_COLUMNS.some((column) => column.status === draggableId);
}

/** Resolves a drag id (a column status or a task id) to the column it belongs to. */
export function findStatusOfDraggable(
  tasksByStatus: KanbanTasksByStatus,
  draggableId: string,
): KanbanStatus | undefined {
  if (isKanbanStatus(draggableId)) {
    return draggableId;
  }

  return KANBAN_COLUMNS.find((column) =>
    tasksByStatus[column.status].some((task) => task.id === draggableId),
  )?.status;
}

export function findTaskById(
  tasksByStatus: KanbanTasksByStatus,
  taskId: string,
): KanbanTask | undefined {
  return Object.values(tasksByStatus)
    .flat()
    .find((task) => task.id === taskId);
}

export function moveTaskToStatus(
  tasksByStatus: KanbanTasksByStatus,
  taskId: string,
  targetStatus: KanbanStatus,
  targetIndex: number,
): KanbanTasksByStatus {
  const sourceStatus = findStatusOfDraggable(tasksByStatus, taskId);
  const movingTask = sourceStatus
    ? tasksByStatus[sourceStatus].find((task) => task.id === taskId)
    : undefined;

  if (!sourceStatus || !movingTask || sourceStatus === targetStatus) {
    return tasksByStatus;
  }

  const targetTasks = [...tasksByStatus[targetStatus]];
  targetTasks.splice(targetIndex, 0, { ...movingTask, status: targetStatus });

  return {
    ...tasksByStatus,
    [sourceStatus]: tasksByStatus[sourceStatus].filter((task) => task.id !== taskId),
    [targetStatus]: targetTasks,
  };
}

export function reorderTaskWithinStatus(
  tasksByStatus: KanbanTasksByStatus,
  status: KanbanStatus,
  activeTaskId: string,
  overTaskId: string,
): KanbanTasksByStatus {
  const columnTasks = tasksByStatus[status];
  const activeIndex = columnTasks.findIndex((task) => task.id === activeTaskId);
  const overIndex = columnTasks.findIndex((task) => task.id === overTaskId);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return tasksByStatus;
  }

  return {
    ...tasksByStatus,
    [status]: arrayMove(columnTasks, activeIndex, overIndex),
  };
}

export function getColumnTitle(status: KanbanStatus): string {
  return KANBAN_COLUMNS.find((column) => column.status === status)?.title ?? status;
}

/** Formats a date-only ISO string (YYYY-MM-DD) without shifting it across time zones. */
export function formatKanbanDate(isoDate: string): string {
  return KANBAN_DATE_FORMATTER.format(new Date(`${isoDate}T00:00:00Z`));
}

export function updateTaskById(
  tasksByStatus: KanbanTasksByStatus,
  taskId: string,
  changes: Partial<Omit<KanbanTask, "id" | "status">>,
): KanbanTasksByStatus {
  const status = findStatusOfDraggable(tasksByStatus, taskId);

  if (!status) {
    return tasksByStatus;
  }

  return {
    ...tasksByStatus,
    [status]: tasksByStatus[status].map((task) =>
      task.id === taskId ? { ...task, ...changes } : task,
    ),
  };
}

export function removeTaskById(
  tasksByStatus: KanbanTasksByStatus,
  taskId: string,
): KanbanTasksByStatus {
  const status = findStatusOfDraggable(tasksByStatus, taskId);

  if (!status) {
    return tasksByStatus;
  }

  return {
    ...tasksByStatus,
    [status]: tasksByStatus[status].filter((task) => task.id !== taskId),
  };
}

export function formatEstimatedTurnaround({ amount, unit }: KanbanEstimatedTurnaround): string {
  const unitLabel = unit === "hours" ? "hour" : "day";
  return `${amount} ${unitLabel}${amount === 1 ? "" : "s"}`;
}

/** A positive turnaround amount from text input, or null if it is empty or invalid. */
export function parseTurnaroundAmount(amountInput: string): number | null {
  const turnaroundAmount = Number(amountInput);
  return amountInput.trim() && Number.isFinite(turnaroundAmount) && turnaroundAmount > 0
    ? turnaroundAmount
    : null;
}

const WORKDAY_ISO_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: WORKDAY_TIME_ZONE,
});

/** Today as YYYY-MM-DD in the workday time zone (US Central), for due dates and date inputs. */
export function getTodayIsoDate(): string {
  return WORKDAY_ISO_DATE_FORMATTER.format(new Date());
}
