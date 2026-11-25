import { BellRing, ChevronRight } from "lucide-react";
import UserAvatar from "@/components/user-avatar";
import { formatKanbanDate } from "@/lib/kanban";
import type { KanbanReviewQueueProps } from "@/types/kanban-review-queue";

/**
 * Cards submitted to the current user, pinned at the top of their Working on It column (US-4.2).
 * Reviewing is part of their work in progress; the card itself stays in Needs Review.
 */
export default function KanbanReviewQueue({ reviewTasks, onOpenTask }: KanbanReviewQueueProps) {
  return (
    <section
      aria-labelledby="kanban-review-queue-title"
      className="mx-2 mb-1 flex flex-col gap-1.5 rounded-lg border border-red-300 bg-red-50 p-2 dark:border-red-500/40 dark:bg-red-500/10"
    >
      <h3
        id="kanban-review-queue-title"
        className="flex items-center gap-1.5 px-1 text-xs font-semibold text-red-900 dark:text-red-300"
      >
        <BellRing aria-hidden className="size-3.5" />
        Waiting for your review ({reviewTasks.length})
      </h3>
      <ul className="flex flex-col gap-1">
        {reviewTasks.map((reviewTask) => (
          <li key={reviewTask.id}>
            <button
              type="button"
              onClick={() => onOpenTask(reviewTask)}
              className="flex w-full items-center gap-2 rounded-md bg-card px-2 py-1.5 text-left text-xs shadow-xs hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
            >
              <UserAvatar name={reviewTask.ownerName} className="size-5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium break-words">{reviewTask.title}</span>
                <span className="text-muted-foreground">
                  {reviewTask.ownerName}
                  {reviewTask.dueDate && ` · Due ${formatKanbanDate(reviewTask.dueDate)}`}
                </span>
              </span>
              <ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
