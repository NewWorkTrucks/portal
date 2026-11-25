"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Lock } from "lucide-react";
import { type CSSProperties, useMemo } from "react";
import KanbanCard from "@/components/kanban/kanban-card";
import KanbanReviewQueue from "@/components/kanban/kanban-review-queue";
import { cn } from "@/lib/utils";
import type { KanbanColumnDefinition, KanbanTask, KanbanTaskActions } from "@/types/kanban";

type KanbanColumnProps = {
  column: KanbanColumnDefinition;
  tasks: KanbanTask[];
  /** Cards in this column before filtering, to show "2 of 5" while filters are on. */
  totalTaskCount: number;
  taskActions: KanbanTaskActions;
  /** Set while dragging a card the current user may not move into this column. */
  dropBlockedReason?: string | null;
  /** This column's place in the board's first-load entrance. Undefined once the entrance is over. */
  entranceColumnIndex?: number;
  /** Working on It only: cards waiting for the current user's review, pinned on top (US-4.2). */
  reviewQueueTasks?: readonly KanbanTask[];
};

/** Long columns shouldn't make the last cards wait; they all join in after this many. */
const MAX_ENTRANCE_CARD_INDEX = 12;

export default function KanbanColumn({
  column,
  tasks,
  totalTaskCount,
  taskActions,
  dropBlockedReason,
  entranceColumnIndex,
  reviewQueueTasks = [],
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);
  const isEntering = entranceColumnIndex !== undefined;

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={`kanban-column-${column.status}`}
      data-tour={`column-${column.status}`}
      style={isEntering ? ({ "--board-enter-index": entranceColumnIndex } as CSSProperties) : undefined}
      className={cn(
        isEntering && "board-enter-column",
        "glass-panel flex max-h-full w-[min(18rem,calc(100vw-3rem))] shrink-0 snap-start flex-col rounded-xl border bg-muted/50 transition-[colors,opacity]",
        isOver && !dropBlockedReason && "border-primary/40 bg-primary/5",
        dropBlockedReason && "border-dashed opacity-50",
      )}
    >
      <header className="flex items-start gap-2 px-3 pt-3 pb-2">
        <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", column.accentClassName)} />
        <div className="min-w-0 flex-1">
          <h2 id={`kanban-column-${column.status}`} className="text-sm font-semibold">
            {column.title}
          </h2>
          <p className="truncate text-xs text-muted-foreground">{column.description}</p>
        </div>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {tasks.length === totalTaskCount ? tasks.length : `${tasks.length} of ${totalTaskCount}`}
        </span>
      </header>

      {dropBlockedReason && (
        <p className="mx-2 mb-2 flex items-start gap-1.5 rounded-md bg-background px-2 py-1.5 text-xs text-muted-foreground">
          <Lock aria-hidden className="mt-0.5 size-3 shrink-0" />
          {dropBlockedReason}
        </p>
      )}

      {reviewQueueTasks.length > 0 && (
        <KanbanReviewQueue reviewTasks={reviewQueueTasks} onOpenTask={taskActions.onOpenDetails} />
      )}

      <SortableContext id={column.status} items={taskIds} strategy={verticalListSortingStrategy}>
        <ul className="flex min-h-24 flex-1 flex-col gap-3 overflow-y-auto px-2 pt-3 pb-2">
          {tasks.map((task, taskIndex) => (
            <KanbanCard
              key={task.id}
              task={task}
              taskActions={taskActions}
              entrance={
                isEntering
                  ? { columnIndex: entranceColumnIndex, cardIndex: Math.min(taskIndex, MAX_ENTRANCE_CARD_INDEX) }
                  : undefined
              }
            />
          ))}
          {tasks.length === 0 && (
            <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
              {totalTaskCount > 0 ? "No matching cards" : "Drop tasks here"}
            </li>
          )}
        </ul>
      </SortableContext>
    </section>
  );
}
