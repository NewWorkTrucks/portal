import { ListTree } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KanbanSubtaskProgressProps } from "@/types/kanban-parent-reporting";

/** "2 of 3 subtasks done" with a bar, on a parent card and its details (Epic 5). */
export default function KanbanSubtaskProgress({ subtaskProgress, className }: KanbanSubtaskProgressProps) {
  const { doneCount, totalCount } = subtaskProgress;
  const donePercent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
  const progressLabel = `${doneCount} of ${totalCount} subtasks done`;

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <ListTree aria-hidden className="size-3 shrink-0" />
      <span className="shrink-0 tabular-nums">
        {doneCount}/{totalCount}
        <span className="sr-only"> subtasks done</span>
      </span>
      <div
        role="progressbar"
        aria-label={progressLabel}
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-valuenow={doneCount}
        title={progressLabel}
        className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full", doneCount === totalCount ? "bg-emerald-500" : "bg-primary")}
          style={{ width: `${donePercent}%` }}
        />
      </div>
    </div>
  );
}
