"use client";

import { ChevronDown, History, MessageCircle, MessageSquareText } from "lucide-react";
import { useMemo, useState } from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import KanbanOperationNoteForm from "@/components/forms/kanban-operation-note-form";
import KanbanActivityFiles from "@/components/kanban/kanban-activity-files";
import KanbanActivityReceipt from "@/components/kanban/kanban-activity-receipt";
import { useKanbanBoard } from "@/components/kanban/kanban-board-provider";
import RichNoteText from "@/components/rich-note-text";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AUDIT_LOG_ACTION_DISPLAY, UPDATE_AUDIT_LOG_ACTIONS } from "@/constants/audit-log-actions";
import { useTaskReceipts } from "@/hooks/use-task-receipts";
import { formatAuditLogTimestamp } from "@/lib/kanban-audit-log";
import type { KanbanAuditLogEntry } from "@/types/audit-log";
import type {
  KanbanTaskActivityEntryProps,
  KanbanTaskActivityListProps,
  KanbanTaskActivityProps,
  KanbanTaskActivityTab,
} from "@/types/kanban-task-activity";

/** How many entries show at first, and how many more each "Show more" adds. */
const ACTIVITY_PAGE_SIZE = 10;

function KanbanTaskActivityEntry({
  auditLogEntry,
  task,
  receiptsByActivityId,
  unseenActivityIds,
  onSeen,
}: KanbanTaskActivityEntryProps) {
  const { mentionables } = useKanbanBoard();
  const { currentUser } = useCurrentUser();

  const { label } = AUDIT_LOG_ACTION_DISPLAY[auditLogEntry.action];

  return (
    <>
      <p className="text-xs">
        <span className="font-medium">{auditLogEntry.actorName}</span>{" "}
        <span className="text-muted-foreground">
          {label.toLowerCase()} · {auditLogEntry.summary}
        </span>
      </p>
      <RichNoteText
        note={auditLogEntry.note}
        mentionables={mentionables}
        currentUserName={currentUser.name}
        className="text-sm"
      />
      <KanbanActivityFiles
        attachments={task.attachments.filter(
          (attachment) => attachment.activityId === auditLogEntry.id,
        )}
      />
      <time
        dateTime={auditLogEntry.occurredAt}
        className="text-xs text-muted-foreground tabular-nums"
      >
        {formatAuditLogTimestamp(auditLogEntry.occurredAt)}
        {auditLogEntry.simulatedByName &&
          ` · via ${auditLogEntry.simulatedByName} (viewing as)`}
      </time>
      <KanbanActivityReceipt
        activityId={auditLogEntry.id}
        receipts={receiptsByActivityId.get(auditLogEntry.id) ?? []}
        isUnseenByViewer={unseenActivityIds.has(auditLogEntry.id)}
        onSeen={onSeen}
      />
    </>
  );
}

function KanbanTaskActivityList({
  task,
  auditLogEntries,
  emptyMessage,
  commentsByUpdateId,
  canComment = false,
  receiptsByActivityId,
  unseenActivityIds,
  onSeen,
}: KanbanTaskActivityListProps) {
  const { addUpdateComment, mentionables } = useKanbanBoard();

  const [visibleEntryCount, setVisibleEntryCount] = useState(ACTIVITY_PAGE_SIZE);
  const [commentingOnUpdateId, setCommentingOnUpdateId] = useState<string | null>(null);

  // Newest first, so the latest entries are always shown.
  const visibleEntries = useMemo(
    () => auditLogEntries.slice(0, visibleEntryCount),
    [auditLogEntries, visibleEntryCount],
  );
  const hiddenEntryCount = auditLogEntries.length - visibleEntries.length;
  const sharedEntryProps = { task, receiptsByActivityId, unseenActivityIds, onSeen };

  function handleClickShowMore() {
    setVisibleEntryCount((currentCount) => currentCount + ACTIVITY_PAGE_SIZE);
  }

  async function handleSubmitComment(updateId: string, note: string) {
    try {
      await addUpdateComment(task, updateId, note);
      setCommentingOnUpdateId(null);
    } catch (error) {
      // TODO: Replace with a toast once the portal has one. The form stays open with the comment.
      window.alert(`Couldn't post comment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (auditLogEntries.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <>
      <ol className="flex flex-col gap-3 border-l pl-4">
        {visibleEntries.map((auditLogEntry) => {
          const { Icon } = AUDIT_LOG_ACTION_DISPLAY[auditLogEntry.action];
          const updateComments = commentsByUpdateId?.get(auditLogEntry.id) ?? [];

          return (
            <li key={auditLogEntry.id} className="relative flex flex-col gap-1">
              <span
                aria-hidden
                className="absolute top-0.5 -left-[1.4rem] flex size-4 items-center justify-center rounded-full border bg-background"
              >
                <Icon className="size-2.5 text-muted-foreground" />
              </span>
              <KanbanTaskActivityEntry auditLogEntry={auditLogEntry} {...sharedEntryProps} />

              {updateComments.length > 0 && (
                <ol
                  aria-label={`Comments (${updateComments.length})`}
                  className="mt-1 flex flex-col gap-3 rounded-md bg-muted/50 p-3"
                >
                  {updateComments.map((updateComment) => (
                    <li key={updateComment.id} className="flex flex-col gap-1">
                      <KanbanTaskActivityEntry auditLogEntry={updateComment} {...sharedEntryProps} />
                    </li>
                  ))}
                </ol>
              )}

              {commentsByUpdateId && canComment && commentingOnUpdateId !== auditLogEntry.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 self-start pointer-coarse:min-h-11"
                  onClick={() => setCommentingOnUpdateId(auditLogEntry.id)}
                >
                  <MessageCircle aria-hidden />
                  Comment
                </Button>
              )}

              {commentingOnUpdateId === auditLogEntry.id && (
                <div className="mt-1 rounded-md border p-3">
                  <KanbanOperationNoteForm
                    noteLabel="Your comment"
                    notePlaceholder="Reply to this update"
                    mentionables={mentionables}
                    submitLabel="Post comment"
                    SubmitIcon={MessageCircle}
                    onSubmit={(note) => handleSubmitComment(auditLogEntry.id, note)}
                    onCancel={() => setCommentingOnUpdateId(null)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {hiddenEntryCount > 0 && (
        <Button variant="outline" size="sm" className="self-start" onClick={handleClickShowMore}>
          <ChevronDown aria-hidden />
          Show {Math.min(hiddenEntryCount, ACTIVITY_PAGE_SIZE)} more
          <span className="text-muted-foreground">({hiddenEntryCount} older)</span>
        </Button>
      )}
    </>
  );
}

/** A card's written updates, opened first, with its full activity log in a second tab. */
export default function KanbanTaskActivity({ task, isOpen }: KanbanTaskActivityProps) {
  const { auditLogEntries, getTaskPermissions } = useKanbanBoard();

  const [activeTab, setActiveTab] = useState<KanbanTaskActivityTab>("updates");

  // TODO: Load the card's activity from the backend activity-log endpoint (per-card view, E1-5).
  const taskAuditLogEntries = useMemo(
    () => auditLogEntries.filter((auditLogEntry) => auditLogEntry.taskId === task.id),
    [auditLogEntries, task.id],
  );
  const taskUpdateEntries = useMemo(
    () =>
      taskAuditLogEntries.filter((auditLogEntry) =>
        UPDATE_AUDIT_LOG_ACTIONS.includes(auditLogEntry.action),
      ),
    [taskAuditLogEntries],
  );
  // Oldest first, so a thread reads like a conversation.
  const commentsByUpdateId = useMemo(() => {
    const updateIds = new Set(taskUpdateEntries.map((updateEntry) => updateEntry.id));
    const groupedComments = new Map<string, KanbanAuditLogEntry[]>();
    for (const auditLogEntry of [...taskAuditLogEntries].reverse()) {
      const { parentActivityId } = auditLogEntry;
      if (parentActivityId && updateIds.has(parentActivityId)) {
        groupedComments.set(parentActivityId, [
          ...(groupedComments.get(parentActivityId) ?? []),
          auditLogEntry,
        ]);
      }
    }
    return groupedComments;
  }, [taskAuditLogEntries, taskUpdateEntries]);
  const { receiptsByActivityId, unseenActivityIds, markSeen } = useTaskReceipts(
    task.id,
    isOpen,
    taskAuditLogEntries,
  );
  // Alerts such as Stuck or a review request are moves, so they're only in All activity.
  // Comments on a listed update already show in its thread.
  const unseenOutsideUpdatesCount = useMemo(
    () =>
      taskAuditLogEntries.filter(
        (auditLogEntry) =>
          unseenActivityIds.has(auditLogEntry.id) &&
          !UPDATE_AUDIT_LOG_ACTIONS.includes(auditLogEntry.action) &&
          !(auditLogEntry.parentActivityId && commentsByUpdateId.has(auditLogEntry.parentActivityId)),
      ).length,
    [commentsByUpdateId, taskAuditLogEntries, unseenActivityIds],
  );

  const sharedListProps = {
    task,
    receiptsByActivityId,
    unseenActivityIds,
    onSeen: markSeen,
  };

  return (
    <section aria-label="Card activity">
      <Tabs
        value={activeTab}
        onValueChange={(newTab: KanbanTaskActivityTab) => setActiveTab(newTab)}
      >
        <TabsList>
          <TabsTrigger value="updates">
            <MessageSquareText aria-hidden />
            Updates ({taskUpdateEntries.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            <History aria-hidden />
            All activity ({taskAuditLogEntries.length})
            {unseenOutsideUpdatesCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[0.625rem] leading-4 text-primary-foreground">
                {unseenOutsideUpdatesCount} new
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="updates">
          <KanbanTaskActivityList
            {...sharedListProps}
            auditLogEntries={taskUpdateEntries}
            emptyMessage="No updates on this card yet."
            commentsByUpdateId={commentsByUpdateId}
            canComment={getTaskPermissions(task).canAddUpdate}
          />
        </TabsContent>
        <TabsContent value="all">
          <KanbanTaskActivityList
            {...sharedListProps}
            auditLogEntries={taskAuditLogEntries}
            emptyMessage="No activity recorded for this card yet."
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
