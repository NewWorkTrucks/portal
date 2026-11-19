"use client";

import { Archive, Bell } from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { useKanbanBoard } from "@/components/kanban/kanban-board-provider";
import RichNoteText from "@/components/rich-note-text";
import UserAvatar from "@/components/user-avatar";
import { AUDIT_LOG_ACTION_DISPLAY } from "@/constants/audit-log-actions";
import { getColumnTitle } from "@/lib/kanban";
import { formatAuditLogTimestamp } from "@/lib/kanban-audit-log";

export default function KanbanAuditLog() {
  const { auditLogEntries, archivedTasks, mentionables } = useKanbanBoard();
  const { currentUser } = useCurrentUser();

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="audit-log-heading" className="flex flex-col gap-3">
        <h2 id="audit-log-heading" className="text-sm font-semibold">
          Activity ({auditLogEntries.length})
        </h2>

        {auditLogEntries.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No activity yet. Create, edit, rename, move, reassign or archive a card on the board.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">When</th>
                  <th scope="col" className="px-3 py-2 font-medium">Who</th>
                  <th scope="col" className="px-3 py-2 font-medium">Action</th>
                  <th scope="col" className="px-3 py-2 font-medium">Card</th>
                  <th scope="col" className="px-3 py-2 font-medium">Details</th>
                  <th scope="col" className="px-3 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {auditLogEntries.map((auditLogEntry) => {
                  const { label, Icon } = AUDIT_LOG_ACTION_DISPLAY[auditLogEntry.action];

                  return (
                    <tr key={auditLogEntry.id} className="border-t align-top">
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground tabular-nums">
                        <time dateTime={auditLogEntry.occurredAt}>
                          {formatAuditLogTimestamp(auditLogEntry.occurredAt)}
                        </time>
                      </td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2">
                          <UserAvatar name={auditLogEntry.actorName} />
                          <span className="flex flex-col">
                            {auditLogEntry.actorName}
                            {auditLogEntry.simulatedByName && (
                              <span className="text-xs text-muted-foreground">
                                via {auditLogEntry.simulatedByName} (viewing as)
                              </span>
                            )}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Icon aria-hidden className="size-3.5 text-muted-foreground" />
                          {label}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium">{auditLogEntry.taskTitle}</td>
                      <td className="px-3 py-2 text-muted-foreground">{auditLogEntry.summary}</td>
                      <td className="px-3 py-2">
                        <RichNoteText
                          note={auditLogEntry.note}
                          mentionables={mentionables}
                          currentUserName={currentUser.name}
                        />
                        {auditLogEntry.mentionedNames.length > 0 && (
                          <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Bell aria-hidden className="size-3" />
                            Notifies {auditLogEntry.mentionedNames.join(", ")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="archived-cards-heading" className="flex flex-col gap-3">
        <h2 id="archived-cards-heading" className="text-sm font-semibold">
          Archived cards ({archivedTasks.length})
        </h2>

        {archivedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No archived cards.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {archivedTasks.map((archivedTask) => (
              <li key={archivedTask.id} className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <Archive aria-hidden className="size-3.5 text-muted-foreground" />
                  <span className="font-medium">{archivedTask.title}</span>
                  <span className="text-muted-foreground">
                    from {getColumnTitle(archivedTask.status)} · {archivedTask.ownerName}
                  </span>
                </span>
                <time dateTime={archivedTask.archivedAt} className="text-xs text-muted-foreground tabular-nums">
                  {formatAuditLogTimestamp(archivedTask.archivedAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
