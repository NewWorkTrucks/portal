"use client";

import { CalendarCheck } from "lucide-react";
import { useMemo } from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import ExpandableContent from "@/components/expandable-content";
import { useKanbanBoard } from "@/components/kanban/kanban-board-provider";
import RichNoteText from "@/components/rich-note-text";
import UserAvatar from "@/components/user-avatar";
import { AUDIT_LOG_ACTION_DISPLAY } from "@/constants/audit-log-actions";
import { getTodayIsoDate, getWorkdayIsoDate } from "@/lib/kanban";
import { formatAuditLogTimestamp } from "@/lib/kanban-audit-log";
import type { KanbanAuditLogAction } from "@/types/audit-log";
import type { KanbanSubtaskAccomplishment, KanbanSubtaskTodayProps } from "@/types/kanban-parent-reporting";

/** What counts as work done on a subtask: written progress and stage moves (submitted, approved, stuck…). */
const ACCOMPLISHMENT_ACTIONS: readonly KanbanAuditLogAction[] = ["daily-update", "update", "moved"];

/** Today's (US Central) updates and moves on a parent's subtasks, so its reviewer sees the day at a glance (US-5.3). */
export default function KanbanSubtaskToday({ subtasks, onOpenTask }: KanbanSubtaskTodayProps) {
  const { auditLogEntries, mentionables } = useKanbanBoard();
  const { currentUser } = useCurrentUser();

  // Newest first, like the activity log.
  const todaysAccomplishments = useMemo<KanbanSubtaskAccomplishment[]>(() => {
    const subtaskById = new Map(subtasks.map((subtask) => [subtask.id, subtask]));
    const todayIsoDate = getTodayIsoDate();
    return auditLogEntries.flatMap((auditLogEntry) => {
      const subtask = subtaskById.get(auditLogEntry.taskId);
      const isTodaysAccomplishment =
        subtask &&
        ACCOMPLISHMENT_ACTIONS.includes(auditLogEntry.action) &&
        getWorkdayIsoDate(auditLogEntry.occurredAt) === todayIsoDate;
      return isTodaysAccomplishment ? [{ subtask, auditLogEntry }] : [];
    });
  }, [auditLogEntries, subtasks]);

  return (
    <section aria-labelledby="task-details-subtask-today" className="flex flex-col gap-2">
      <h3 id="task-details-subtask-today" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarCheck aria-hidden className="size-3.5" />
        Today on subtasks ({todaysAccomplishments.length})
      </h3>
      {todaysAccomplishments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No updates or moves on subtasks yet today.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {todaysAccomplishments.map(({ subtask, auditLogEntry }) => (
            <li key={auditLogEntry.id} className="flex flex-col gap-1 rounded-md border px-3 py-2">
              <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
                <UserAvatar name={auditLogEntry.actorName} className="size-4 shrink-0" />
                <span className="font-medium">{auditLogEntry.actorName}</span>
                <span className="text-muted-foreground">
                  {AUDIT_LOG_ACTION_DISPLAY[auditLogEntry.action].label.toLowerCase()} on
                </span>
                <button
                  type="button"
                  onClick={() => onOpenTask(subtask)}
                  className="min-w-0 font-medium break-words underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {subtask.title}
                </button>
              </p>
              {auditLogEntry.summary && (
                <p className="text-xs text-muted-foreground">{auditLogEntry.summary}</p>
              )}
              <ExpandableContent collapsedHeightRem={5}>
                <RichNoteText
                  note={auditLogEntry.note}
                  mentionables={mentionables}
                  currentUserName={currentUser.name}
                  className="text-sm"
                />
              </ExpandableContent>
              <time dateTime={auditLogEntry.occurredAt} className="text-xs text-muted-foreground tabular-nums">
                {formatAuditLogTimestamp(auditLogEntry.occurredAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
