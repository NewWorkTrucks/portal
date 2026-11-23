"use client";

import { ClockAlert, MoreHorizontal } from "lucide-react";
import type { MouseEvent } from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import { useKanbanBoard } from "@/components/kanban/kanban-board-provider";
import KanbanTaskContextMenuContent from "@/components/kanban/kanban-task-context-menu-content";
import MentionText from "@/components/mention-text";
import { Button } from "@/components/ui/button";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import UserAvatar from "@/components/user-avatar";
import { KANBAN_COLUMNS } from "@/constants/kanban-columns";
import { KANBAN_PRIORITY_BADGE_CLASS_NAMES } from "@/constants/kanban-task-priorities";
import { formatEstimatedTurnaround, formatKanbanDate } from "@/lib/kanban";
import { toPlainNoteText } from "@/lib/rich-note";
import { cn } from "@/lib/utils";
import type { KanbanTaskListProps, KanbanTaskMenuProps } from "@/types/kanban";

const EMPTY_CELL_LABEL = "None";
const TABLE_HEADINGS = ["Task", "Stage", "Owner", "Priority", "Due", "Follow-up", "Turnaround", "Latest note"];

function KanbanTaskListRow({ task, teamMembers, taskActions }: KanbanTaskMenuProps) {
  const { mentionables } = useKanbanBoard();
  const { currentUser } = useCurrentUser();

  const taskColumn = KANBAN_COLUMNS.find((column) => column.status === task.status);
  const scheduledDate = task.followUpDate ?? task.revisitDate;
  const scheduledDateLabel = task.followUpDate ? "Follow up" : "Revisit";

  function handleClickActions(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    taskActions.onOpenCardActions(task);
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={<tr />}
        className="cursor-pointer transition-colors hover:bg-muted/50"
        onClick={() => taskActions.onOpenDetails(task)}
      >
        <td className="max-w-72 px-3 py-2">
          {/* The row handles the click, so keyboard users get the same action from this button. */}
          <button type="button" className="block w-full rounded-sm text-left font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="line-clamp-2">{task.title}</span>
          </button>
          {task.status === "working-on-it" && task.dailyUpdateMissedOn && (
            <span className="mt-1 flex w-fit items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-500/15 dark:text-amber-300">
              <ClockAlert aria-hidden className="size-3" />
              Update missed
            </span>
          )}
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          <span className="flex items-center gap-2">
            <span aria-hidden className={cn("size-2 shrink-0 rounded-full", taskColumn?.accentClassName)} />
            {taskColumn?.title}
          </span>
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          <span className="flex items-center gap-1.5">
            <UserAvatar name={task.ownerName} />
            {task.ownerName}
          </span>
        </td>
        <td className="px-3 py-2">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
              KANBAN_PRIORITY_BADGE_CLASS_NAMES[task.priority],
            )}
          >
            {task.priority}
          </span>
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
          {task.dueDate ? formatKanbanDate(task.dueDate) : EMPTY_CELL_LABEL}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
          {scheduledDate ? `${scheduledDateLabel}: ${formatKanbanDate(scheduledDate)}` : EMPTY_CELL_LABEL}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
          {task.estimatedTurnaround ? formatEstimatedTurnaround(task.estimatedTurnaround) : EMPTY_CELL_LABEL}
        </td>
        <td className="max-w-64 px-3 py-2 text-xs text-muted-foreground">
          {task.latestNote ? (
            <span className="line-clamp-2">
              <MentionText
                text={toPlainNoteText(task.latestNote)}
                mentionables={mentionables}
                currentUserName={currentUser.name}
              />
            </span>
          ) : (
            EMPTY_CELL_LABEL
          )}
        </td>
        <td className="sticky right-0 bg-popover px-2 py-1 text-right backdrop-blur-xl">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${task.title}`}
            onClick={handleClickActions}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </td>
      </ContextMenuTrigger>
      <KanbanTaskContextMenuContent task={task} teamMembers={teamMembers} taskActions={taskActions} />
    </ContextMenu>
  );
}

/** Every visible task as a table, in stage order. Uses the board's filters, permissions and dialogs. */
export default function KanbanTaskList({ tasks, totalTaskCount, teamMembers, taskActions }: KanbanTaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="px-4 pb-6 sm:px-6">
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {totalTaskCount > 0 ? "No matching tasks" : "No tasks yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 px-4 pb-6 sm:px-6">
      <div className="max-h-full overflow-auto rounded-lg border bg-card text-card-foreground">
        <table className="w-full min-w-5xl text-left text-sm">
          <caption className="sr-only">Kanban tasks</caption>
          <thead className="sticky top-0 z-10 bg-popover text-xs text-muted-foreground backdrop-blur-xl">
            <tr>
              {TABLE_HEADINGS.map((tableHeading) => (
                <th key={tableHeading} scope="col" className="px-3 py-2 font-medium whitespace-nowrap">
                  {tableHeading}
                </th>
              ))}
              <th scope="col" className="sticky right-0 bg-popover px-3 py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.map((task) => (
              <KanbanTaskListRow key={task.id} task={task} teamMembers={teamMembers} taskActions={taskActions} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
