import DashboardPanel from "@/components/dashboard/dashboard-panel";
import { KANBAN_COLUMNS } from "@/constants/kanban-columns";
import { KANBAN_PRIORITY_BADGE_CLASS_NAMES, KANBAN_TASK_PRIORITY_OPTIONS } from "@/constants/kanban-task-priorities";
import { cn } from "@/lib/utils";
import type { DashboardStageSnapshotProps } from "@/types/dashboard";

/** Cards per stage, open work per priority, and each owner's open, stuck and overdue cards. */
export default function DashboardStageSnapshot({ stageCounts }: DashboardStageSnapshotProps) {
  const largestStageCount = Math.max(1, ...stageCounts.byStatus.map((stageCount) => stageCount.count));
  const totalCardCount = stageCounts.byStatus.reduce((total, stageCount) => total + stageCount.count, 0);

  return (
    <DashboardPanel title="Board snapshot" description={`${totalCardCount} cards on the board, not counting archived ones.`}>
      <ul className="flex flex-col gap-2">
        {KANBAN_COLUMNS.map((column) => {
          const count = stageCounts.byStatus.find((stageCount) => stageCount.status === column.status)?.count ?? 0;

          return (
            <li key={column.status} className="grid grid-cols-[7.5rem_minmax(0,1fr)_2rem] items-center gap-2 text-sm">
              <span className="flex items-center gap-1.5 truncate">
                <span aria-hidden className={cn("size-2 shrink-0 rounded-full", column.accentClassName)} />
                {column.title}
              </span>
              <span aria-hidden className="h-2 overflow-hidden rounded-full bg-muted">
                <span
                  className={cn("block h-full rounded-full", column.accentClassName)}
                  style={{ width: `${(count / largestStageCount) * 100}%` }}
                />
              </span>
              <span className="text-right font-medium tabular-nums">{count}</span>
            </li>
          );
        })}
      </ul>

      {stageCounts.byPriority.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xs text-muted-foreground">Open cards by priority</h3>
          <ul className="flex flex-wrap gap-2">
            {KANBAN_TASK_PRIORITY_OPTIONS.map((priorityOption) => {
              const openCount =
                stageCounts.byPriority.find((priorityCount) => priorityCount.priority === priorityOption.value)?.openCount ?? 0;
              return (
                <li
                  key={priorityOption.value}
                  className={cn(
                    "rounded px-2 py-0.5 text-xs font-semibold tabular-nums",
                    KANBAN_PRIORITY_BADGE_CLASS_NAMES[priorityOption.value],
                  )}
                >
                  {priorityOption.label}: {openCount}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {stageCounts.byOwner.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xs text-muted-foreground">Open work by owner</h3>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-1.5 font-medium">Owner</th>
                  <th scope="col" className="px-3 py-1.5 text-right font-medium">Open</th>
                  <th scope="col" className="px-3 py-1.5 text-right font-medium">Stuck</th>
                  <th scope="col" className="px-3 py-1.5 text-right font-medium">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {stageCounts.byOwner.map((ownerWorkload) => (
                  <tr key={ownerWorkload.ownerId} className="border-t">
                    <th scope="row" className="px-3 py-1.5 font-normal">{ownerWorkload.ownerName}</th>
                    <td className="px-3 py-1.5 text-right tabular-nums">{ownerWorkload.openCount}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{ownerWorkload.stuckCount}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{ownerWorkload.overdueCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}
