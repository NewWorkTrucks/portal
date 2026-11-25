import type { KanbanTask } from "@/types/kanban";

export type KanbanReviewQueueProps = {
  /** Cards in Needs Review whose reviewer is the current user. */
  reviewTasks: readonly KanbanTask[];
  onOpenTask: (task: KanbanTask) => void;
};
