"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Lock } from "lucide-react";
import { useMemo } from "react";
import KanbanCard from "@/components/kanban/kanban-card";
import { cn } from "@/lib/utils";
import type { KanbanColumnDefinition, KanbanTask, KanbanTaskActions } from "@/types/kanban";
import type { TeamMember } from "@/types/team";

type KanbanColumnProps = {
  column: KanbanColumnDefinition;
  tasks: KanbanTask[];
  /** Cards in this column before filtering, to show "2 of 5" while filters are on. */
  totalTaskCount: number;
  teamMembers: TeamMember[];
  taskActions: KanbanTaskActions;
  /** Set while dragging a card the current user may not move into this column. */
  dropBlockedReason?: string | null;
};

export default function KanbanColumn({
  column,
  tasks,
  totalTaskCount,
  teamMembers,
  taskActions,
  dropBlockedReason,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={`kanban-column-${column.status}`}
      className={cn(
        "flex max-h-full w-72 shrink-0 flex-col rounded-xl border bg-muted/50 transition-[colors,opacity]",
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

      <SortableContext id={column.status} items={taskIds} strategy={verticalListSortingStrategy}>
        <ul className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              teamMembers={teamMembers}
              taskActions={taskActions}
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
