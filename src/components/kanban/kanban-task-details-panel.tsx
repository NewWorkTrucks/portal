"use client";

import {
  Archive,
  CalendarClock,
  CalendarDays,
  CircleCheck,
  ClipboardCheck,
  CornerUpLeft,
  Download,
  FileMinus,
  History,
  Lock,
  Paperclip,
  Pencil,
  TextCursorInput,
  Timer,
  UserRoundPen,
} from "lucide-react";
import { type ReactNode, useMemo } from "react";
import AttachmentPicker from "@/components/attachment-picker";
import { useCurrentUser } from "@/components/current-user-provider";
import { useKanbanBoard } from "@/components/kanban/kanban-board-provider";
import MentionText from "@/components/mention-text";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import UserAvatar from "@/components/user-avatar";
import { MAX_ATTACHMENT_SIZE_BYTES } from "@/constants/attachments";
import { AUDIT_LOG_ACTION_DISPLAY } from "@/constants/audit-log-actions";
import { KANBAN_COLUMNS } from "@/constants/kanban-columns";
import { KANBAN_ROLE_DEFINITIONS } from "@/constants/kanban-role-capabilities";
import { KANBAN_TASK_PRIORITY_OPTIONS } from "@/constants/kanban-task-priorities";
import { formatEstimatedTurnaround, formatKanbanDate } from "@/lib/kanban";
import { formatAuditLogTimestamp } from "@/lib/kanban-audit-log";
import { formatFileSize } from "@/lib/kanban-stages";
import { cn } from "@/lib/utils";
import type { KanbanTask, KanbanTaskActions } from "@/types/kanban";
import type { TeamMember } from "@/types/team";

type KanbanTaskDetailsPanelProps = {
  task: KanbanTask | null;
  teamMembers: TeamMember[];
  taskActions: KanbanTaskActions;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

type DetailRowProps = {
  label: string;
  children: ReactNode;
};

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1.5 text-sm">{children}</dd>
    </div>
  );
}

/** Side panel opened by clicking a card: full details, actions for the current role, and the card's own activity. */
export default function KanbanTaskDetailsPanel({
  task,
  teamMembers,
  taskActions,
  isOpen,
  onOpenChange,
}: KanbanTaskDetailsPanelProps) {
  const { auditLogEntries, mentionables, getTaskPermissions } = useKanbanBoard();
  const { currentUser } = useCurrentUser();

  // TODO: Load the card's activity from the backend activity-log endpoint (per-card view, E1-5).
  const taskAuditLogEntries = useMemo(
    () => (task ? auditLogEntries.filter((auditLogEntry) => auditLogEntry.taskId === task.id) : []),
    [auditLogEntries, task],
  );

  const column = task ? KANBAN_COLUMNS.find((kanbanColumn) => kanbanColumn.status === task.status) : undefined;
  const priorityLabel = task
    ? KANBAN_TASK_PRIORITY_OPTIONS.find((option) => option.value === task.priority)?.label
    : undefined;
  const taskPermissions = task ? getTaskPermissions(task) : null;
  const isAnyActionLimited =
    taskPermissions !== null &&
    (!taskPermissions.canEdit ||
      !taskPermissions.canRename ||
      !taskPermissions.canChangeOwner ||
      !taskPermissions.canArchive);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto data-[side=right]:sm:max-w-md">
        {task && taskPermissions && (
          <>
            <SheetHeader className="gap-2 border-b pr-12">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 font-medium">
                  <span aria-hidden className={cn("size-2 rounded-full", column?.accentClassName)} />
                  {column?.title}
                </span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-semibold tracking-wide uppercase">
                  {priorityLabel} priority
                </span>
              </div>
              <SheetTitle className="text-base">{task.title}</SheetTitle>
              <SheetDescription>{task.description || "No description."}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-6 p-4">
              <dl className="grid grid-cols-2 gap-4">
                <DetailRow label="Owner">
                  <UserAvatar name={task.ownerName} />
                  {task.ownerName}
                </DetailRow>
                <DetailRow label="Due date">
                  <CalendarDays aria-hidden className="size-3.5 text-muted-foreground" />
                  {formatKanbanDate(task.dueDate)}
                </DetailRow>
                <DetailRow label="Estimated turnaround">
                  <Timer aria-hidden className="size-3.5 text-muted-foreground" />
                  {formatEstimatedTurnaround(task.estimatedTurnaround)}
                </DetailRow>
                {task.followUpDate && (
                  <DetailRow label="Follow up">
                    <CalendarClock aria-hidden className="size-3.5 text-muted-foreground" />
                    {formatKanbanDate(task.followUpDate)}
                  </DetailRow>
                )}
                {task.revisitDate && (
                  <DetailRow label="Revisit">
                    <CalendarClock aria-hidden className="size-3.5 text-muted-foreground" />
                    {formatKanbanDate(task.revisitDate)}
                  </DetailRow>
                )}
                {task.status === "needs-review" && task.reviewerName && (
                  <DetailRow label="Reviewer">
                    <UserAvatar name={task.reviewerName} />
                    {task.reviewerName}
                  </DetailRow>
                )}
                {task.deferralCount > 0 && (
                  <DetailRow label="Times deferred">{task.deferralCount}</DetailRow>
                )}
                {task.lastDailyUpdateAt && (
                  <DetailRow label="Last daily update">
                    {formatAuditLogTimestamp(task.lastDailyUpdateAt)}
                  </DetailRow>
                )}
              </dl>

              {task.waitingDetails && (
                <dl className="grid gap-3 rounded-md border p-3">
                  <DetailRow label="Waiting on">{task.waitingDetails.waitingOnWhat}</DetailRow>
                  <DetailRow label="Who">{task.waitingDetails.waitingOnWho}</DetailRow>
                  <DetailRow label="Contacted">{formatKanbanDate(task.waitingDetails.contactedDate)}</DetailRow>
                </dl>
              )}
              {task.blockerDetails && (
                <dl className="grid gap-3 rounded-md border border-destructive/30 p-3">
                  <DetailRow label="Blocker">{task.blockerDetails.blocker}</DetailRow>
                  <DetailRow label="Tried">{task.blockerDetails.attempts}</DetailRow>
                  <DetailRow label="Help needed">{task.blockerDetails.helpNeeded}</DetailRow>
                </dl>
              )}
              {task.completionSummary && (
                <dl className="grid gap-3 rounded-md border border-emerald-500/30 p-3">
                  <DetailRow label="Completed work">{task.completionSummary.completedWork}</DetailRow>
                  <DetailRow label="Outcome">{task.completionSummary.outcome}</DetailRow>
                </dl>
              )}

              {task.latestNote && (
                <section aria-labelledby="task-details-latest-note" className="flex flex-col gap-1.5">
                  <h3 id="task-details-latest-note" className="text-xs text-muted-foreground">
                    Latest note
                  </h3>
                  <p className="rounded-md bg-muted px-3 py-2 text-sm whitespace-pre-line">
                    <MentionText
                      text={task.latestNote}
                      mentionables={mentionables}
                      currentUserName={currentUser.name}
                    />
                  </p>
                </section>
              )}

              {(task.status === "working-on-it" || task.status === "needs-review") && (
                <section aria-label="Stage actions" className="flex flex-wrap gap-2">
                  {task.status === "working-on-it" && (
                    <Button
                      disabled={!taskPermissions.canPostDailyUpdate}
                      onClick={() => taskActions.onClickDailyUpdate(task)}
                    >
                      <ClipboardCheck aria-hidden />
                      Post daily update
                    </Button>
                  )}
                  {task.status === "needs-review" && (
                    <>
                      <Button
                        disabled={!taskPermissions.canReview}
                        onClick={() => taskActions.onClickApprove(task)}
                      >
                        <CircleCheck aria-hidden />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        disabled={!taskPermissions.canReview}
                        onClick={() => taskActions.onClickReturn(task)}
                      >
                        <CornerUpLeft aria-hidden />
                        Return for revisions
                      </Button>
                    </>
                  )}
                </section>
              )}

              <section aria-label="Actions" className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={!taskPermissions.canEdit}
                    onClick={() => taskActions.onClickEdit(task)}
                  >
                    <Pencil aria-hidden />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!taskPermissions.canRename}
                    onClick={() => taskActions.onClickRename(task)}
                  >
                    <TextCursorInput aria-hidden />
                    Rename
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      disabled={!taskPermissions.canChangeOwner}
                      render={<Button variant="outline" />}
                    >
                      <UserRoundPen aria-hidden />
                      Change owner
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Reassign to</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                          value={task.ownerName}
                          onValueChange={(ownerName: string) =>
                            taskActions.onSelectOwner(task, ownerName)
                          }
                        >
                          {teamMembers.map((teamMember) => (
                            <DropdownMenuRadioItem
                              key={teamMember.id}
                              value={teamMember.name}
                              closeOnClick
                            >
                              <UserAvatar name={teamMember.name} className="size-5" />
                              {teamMember.name}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="destructive"
                    disabled={!taskPermissions.canArchive}
                    onClick={() => taskActions.onClickArchive(task)}
                  >
                    <Archive aria-hidden />
                    Archive
                  </Button>
                </div>
                {isAnyActionLimited && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock aria-hidden className="size-3 shrink-0" />
                    Some actions are limited for your role (
                    {KANBAN_ROLE_DEFINITIONS[currentUser.role].label}).
                  </p>
                )}
              </section>

              <section aria-labelledby="task-details-attachments" className="flex flex-col gap-3">
                <h3
                  id="task-details-attachments"
                  className="flex items-center gap-1.5 text-sm font-semibold"
                >
                  <Paperclip aria-hidden className="size-4 text-muted-foreground" />
                  Attachments ({task.attachments.length})
                </h3>

                {task.attachments.length > 0 && (
                  <ul className="flex flex-col divide-y rounded-md border">
                    {task.attachments.map((attachment) => (
                      <li key={attachment.id} className="flex items-center gap-2 px-3 py-2">
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium">{attachment.fileName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.sizeBytes)} · {attachment.uploadedByName} ·{" "}
                            {formatAuditLogTimestamp(attachment.uploadedAt)}
                          </span>
                        </div>
                        <a
                          href={attachment.url}
                          download={attachment.fileName}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label={`Download ${attachment.fileName}`}
                        >
                          <Download aria-hidden className="size-4" />
                        </a>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={!taskPermissions.canManageAttachments}
                          onClick={() => taskActions.onClickRemoveAttachment(task, attachment)}
                          aria-label={`Remove ${attachment.fileName}`}
                        >
                          <FileMinus aria-hidden />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}

                <AttachmentPicker
                  maxFileSizeBytes={MAX_ATTACHMENT_SIZE_BYTES}
                  disabled={!taskPermissions.canManageAttachments}
                  onSelectFiles={(files) => taskActions.onSelectAttachments(task, files)}
                />
              </section>

              <section aria-labelledby="task-details-activity" className="flex flex-col gap-3">
                <h3
                  id="task-details-activity"
                  className="flex items-center gap-1.5 text-sm font-semibold"
                >
                  <History aria-hidden className="size-4 text-muted-foreground" />
                  Activity ({taskAuditLogEntries.length})
                </h3>

                {taskAuditLogEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No activity recorded for this card yet.
                  </p>
                ) : (
                  <ol className="flex flex-col gap-3 border-l pl-4">
                    {taskAuditLogEntries.map((auditLogEntry) => {
                      const { label, Icon } = AUDIT_LOG_ACTION_DISPLAY[auditLogEntry.action];

                      return (
                        <li key={auditLogEntry.id} className="relative flex flex-col gap-1">
                          <span
                            aria-hidden
                            className="absolute top-0.5 -left-[1.4rem] flex size-4 items-center justify-center rounded-full border bg-background"
                          >
                            <Icon className="size-2.5 text-muted-foreground" />
                          </span>
                          <p className="text-xs">
                            <span className="font-medium">{auditLogEntry.actorName}</span>{" "}
                            <span className="text-muted-foreground">
                              {label.toLowerCase()} · {auditLogEntry.summary}
                            </span>
                          </p>
                          <p className="text-sm whitespace-pre-line">
                            <MentionText
                              text={auditLogEntry.note}
                              mentionables={mentionables}
                              currentUserName={currentUser.name}
                            />
                          </p>
                          <time
                            dateTime={auditLogEntry.occurredAt}
                            className="text-xs text-muted-foreground tabular-nums"
                          >
                            {formatAuditLogTimestamp(auditLogEntry.occurredAt)}
                            {auditLogEntry.simulatedByName &&
                              ` · via ${auditLogEntry.simulatedByName} (viewing as)`}
                          </time>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
