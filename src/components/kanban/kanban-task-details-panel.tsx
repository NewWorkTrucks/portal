"use client";

import {
  Archive,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  ClipboardCheck,
  CornerLeftUp,
  CornerUpLeft,
  Download,
  FileMinus,
  Lock,
  ListTree,
  MessageSquarePlus,
  Paperclip,
  Pencil,
  Plus,
  TextCursorInput,
  Timer,
  UserRoundPen,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import AttachmentPicker from "@/components/attachment-picker";
import { useCurrentUser } from "@/components/current-user-provider";
import { useKanbanBoard } from "@/components/kanban/kanban-board-provider";
import KanbanTaskActivity from "@/components/kanban/kanban-task-activity";
import ExpandableContent from "@/components/expandable-content";
import RichNoteText from "@/components/rich-note-text";
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
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import UserAvatar from "@/components/user-avatar";
import { useIsPhoneViewport } from "@/hooks/use-is-phone-viewport";
import { MAX_ATTACHMENT_SIZE_BYTES } from "@/constants/attachments";
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
  /** The card this one is a subtask of. */
  parentTask: KanbanTask | null;
  subtasks: KanbanTask[];
  onOpenTask: (task: KanbanTask) => void;
  onClickAddSubtask: (parentTask: KanbanTask) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

/** Attachments listed before the rest are tucked behind "Show more". */
const VISIBLE_ATTACHMENT_COUNT = 5;

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
  parentTask,
  subtasks,
  onOpenTask,
  onClickAddSubtask,
  isOpen,
  onOpenChange,
}: KanbanTaskDetailsPanelProps) {
  const { mentionables, getTaskPermissions } = useKanbanBoard();
  const { currentUser } = useCurrentUser();
  const isPhoneViewport = useIsPhoneViewport();

  // Remembered per card, so opening another card starts with the short list again.
  const [taskIdWithAllAttachmentsShown, setTaskIdWithAllAttachmentsShown] = useState<string | null>(null);

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

  const areAllAttachmentsShown = task !== null && taskIdWithAllAttachmentsShown === task.id;
  const visibleAttachments = task
    ? areAllAttachmentsShown
      ? task.attachments
      : task.attachments.slice(0, VISIBLE_ATTACHMENT_COUNT)
    : [];
  const hiddenAttachmentCount = task ? task.attachments.length - visibleAttachments.length : 0;

  function handleClickToggleAttachments() {
    setTaskIdWithAllAttachmentsShown((currentTaskId) => (currentTaskId === task?.id ? null : (task?.id ?? null)));
  }

  const panelBody = task && taskPermissions && (
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
        <SheetDescription render={<div />}>
          <ExpandableContent collapsedHeightRem={5}>{task.description || "No description."}</ExpandableContent>
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-6 p-4">
        <dl className="grid grid-cols-2 gap-4">
          <DetailRow label="Owner">
            <UserAvatar name={task.ownerName} />
            {task.ownerName}
          </DetailRow>
          {task.assignedByName && (
            <DetailRow label="Assigned by">
              <UserAvatar name={task.assignedByName} />
              {task.assignedByName}
            </DetailRow>
          )}
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
            <DetailRow label="Waiting on">
              <ExpandableContent collapsedHeightRem={5}>{task.waitingDetails.waitingOnWhat}</ExpandableContent>
            </DetailRow>
            <DetailRow label="Who">{task.waitingDetails.waitingOnWho}</DetailRow>
            <DetailRow label="Contacted">{formatKanbanDate(task.waitingDetails.contactedDate)}</DetailRow>
          </dl>
        )}
        {task.blockerDetails && (
          <dl className="grid gap-3 rounded-md border border-destructive/30 p-3">
            <DetailRow label="Blocker">
              <ExpandableContent collapsedHeightRem={5}>{task.blockerDetails.blocker}</ExpandableContent>
            </DetailRow>
            <DetailRow label="Tried">
              <ExpandableContent collapsedHeightRem={5}>{task.blockerDetails.attempts}</ExpandableContent>
            </DetailRow>
            <DetailRow label="Help needed">
              <ExpandableContent collapsedHeightRem={5}>{task.blockerDetails.helpNeeded}</ExpandableContent>
            </DetailRow>
          </dl>
        )}
        {task.completionSummary && (
          <dl className="grid gap-3 rounded-md border border-emerald-500/30 p-3">
            <DetailRow label="Completed work">
              <ExpandableContent collapsedHeightRem={5}>{task.completionSummary.completedWork}</ExpandableContent>
            </DetailRow>
            <DetailRow label="Outcome">
              <ExpandableContent collapsedHeightRem={5}>{task.completionSummary.outcome}</ExpandableContent>
            </DetailRow>
          </dl>
        )}

        {task.latestNote && (
          <section aria-labelledby="task-details-latest-note" className="flex flex-col gap-1.5">
            <h3 id="task-details-latest-note" className="text-xs text-muted-foreground">
              Latest note
            </h3>
            <ExpandableContent collapsedHeightRem={7} className="rounded-md bg-muted px-3 py-2">
              <RichNoteText
                note={task.latestNote}
                mentionables={mentionables}
                currentUserName={currentUser.name}
                className="text-sm"
              />
            </ExpandableContent>
          </section>
        )}

        {parentTask && (
          <section aria-label="Parent card" className="flex flex-col gap-1.5">
            <h3 className="text-xs text-muted-foreground">Subtask of</h3>
            <Button variant="outline" className="h-auto justify-start py-2 text-left" onClick={() => onOpenTask(parentTask)}>
              <CornerLeftUp aria-hidden />
              <span className="min-w-0 break-words whitespace-normal">{parentTask.title}</span>
            </Button>
          </section>
        )}

        {!task.parentTaskId && (subtasks.length > 0 || taskPermissions.canEdit) && (
          <section aria-labelledby="task-details-subtasks" className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <h3 id="task-details-subtasks" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ListTree aria-hidden className="size-3.5" />
                Subtasks ({subtasks.length})
              </h3>
              <Button variant="outline" size="sm" disabled={!taskPermissions.canEdit} onClick={() => onClickAddSubtask(task)}>
                <Plus aria-hidden />
                Add subtask
              </Button>
            </div>
            {subtasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subtasks yet.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {subtasks.map((subtask) => (
                  <li key={subtask.id}>
                    <button
                      type="button"
                      onClick={() => onOpenTask(subtask)}
                      className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <UserAvatar name={subtask.ownerName} className="size-5 shrink-0" />
                      <span className="min-w-0 flex-1 break-words">{subtask.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {KANBAN_COLUMNS.find((kanbanColumn) => kanbanColumn.status === subtask.status)?.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section aria-label="Update and stage actions" className="flex flex-wrap gap-2">
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
            <Button
              variant={
                task.status === "working-on-it" || task.status === "needs-review"
                  ? "outline"
                  : "default"
              }
              disabled={!taskPermissions.canAddUpdate}
              onClick={() => taskActions.onClickAddUpdate(task)}
            >
              <MessageSquarePlus aria-hidden />
              Add update
            </Button>
          </section>

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
              {visibleAttachments.map((attachment) => (
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

          {task.attachments.length > VISIBLE_ATTACHMENT_COUNT && (
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              aria-expanded={areAllAttachmentsShown}
              onClick={handleClickToggleAttachments}
            >
              {areAllAttachmentsShown ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />}
              {areAllAttachmentsShown ? "Show fewer files" : `Show ${hiddenAttachmentCount} more`}
            </Button>
          )}

          <AttachmentPicker
            maxFileSizeBytes={MAX_ATTACHMENT_SIZE_BYTES}
            disabled={!taskPermissions.canManageAttachments}
            onSelectFiles={(files) => taskActions.onSelectAttachments(task, files)}
          />
        </section>

        <KanbanTaskActivity key={task.id} task={task} isOpen={isOpen} />
      </div>
    </>
  );

  // Phones get a bottom drawer that swipes closed, like a native app.
  if (isPhoneViewport) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent>{panelBody}</DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto data-[side=right]:sm:max-w-md">{panelBody}</SheetContent>
    </Sheet>
  );
}
