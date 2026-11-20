"use client";

import { useSortable } from "@dnd-kit/sortable";
import { type KeyboardEvent, type MouseEvent, type PointerEvent, useRef } from "react";
import { CSS } from "@dnd-kit/utilities";
import { motion, type TargetAndTransition, type Transition } from "framer-motion";
import {
  Archive,
  CalendarClock,
  CircleCheck,
  ClipboardCheck,
  CornerUpLeft,
  Eye,
  Paperclip,
  Repeat,
  Lock,
  CalendarDays,
  MessageSquarePlus,
  MessageSquareText,
  Timer,
  Pencil,
  TextCursorInput,
  UserRoundPen,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useCurrentUser } from "@/components/current-user-provider";
import { useDevicePreferences } from "@/components/device-preferences-provider";
import { useKanbanBoard } from "@/components/kanban/kanban-board-provider";
import MentionText from "@/components/mention-text";
import { toPlainNoteText } from "@/lib/rich-note";
import UserAvatar from "@/components/user-avatar";
import { KANBAN_ROLE_DEFINITIONS } from "@/constants/kanban-role-capabilities";
import { cn } from "@/lib/utils";
import { formatEstimatedTurnaround, formatKanbanDate } from "@/lib/kanban";
import type { KanbanTask, KanbanTaskActions, KanbanTaskPriority } from "@/types/kanban";
import type { TeamMember } from "@/types/team";

// A pointer that moves further than this between press and release was a drag, not a click.
const CLICK_MOVEMENT_TOLERANCE_PX = 5;

const PRIORITY_BADGE_CLASS_NAMES: Record<KanbanTaskPriority, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

type KanbanCardProps = {
  task: KanbanTask;
  teamMembers: TeamMember[];
  taskActions: KanbanTaskActions;
};

// Hover lift for cards in a column. Translate only: scale or rotate would skew dnd-kit's measurements.
const CARD_HOVER_LIFT: TargetAndTransition = { y: -3 };
const CARD_HOVER_TRANSITION: Transition = { type: "spring", stiffness: 500, damping: 30 };

type KanbanCardContentProps = {
  task: KanbanTask;
  isOverlay?: boolean;
};

/** Visual body of a card, shared by the in-column card and the drag overlay. */
export function KanbanCardContent({ task, isOverlay = false }: KanbanCardContentProps) {
  const { mentionables } = useKanbanBoard();
  const { currentUser } = useCurrentUser();
  const { isLowSpecModeOn } = useDevicePreferences();

  // The drag overlay and low spec mode get no hover animation.
  const hasHoverEffect = !isOverlay && !isLowSpecModeOn;
  const scheduledDate = task.followUpDate ?? task.revisitDate;
  const scheduledDateLabel = task.followUpDate ? "Follow up" : "Revisit";

  return (
    <motion.article
      whileHover={hasHoverEffect ? CARD_HOVER_LIFT : undefined}
      transition={CARD_HOVER_TRANSITION}
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border bg-card p-3 text-card-foreground shadow-xs",
        // No rotate/scale here: transforms skew the overlay's measured rect and break keyboard moves.
        isOverlay && "cursor-grabbing shadow-lg ring-2 ring-primary/40",
        hasHoverEffect && "transition-[box-shadow,border-color] duration-200 hover:border-primary/40 hover:shadow-md",
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <h3 className="text-sm leading-snug font-medium">{task.title}</h3>
        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
            PRIORITY_BADGE_CLASS_NAMES[task.priority],
          )}
        >
          {task.priority}
        </span>
      </header>

      <p className="line-clamp-2 text-xs text-muted-foreground">{task.description}</p>

      {task.latestNote && (
        <p className="flex gap-1.5 rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">
          <MessageSquareText aria-hidden className="mt-0.5 size-3 shrink-0" />
          <span className="line-clamp-2">
            <MentionText
              text={toPlainNoteText(task.latestNote)}
              mentionables={mentionables}
              currentUserName={currentUser.name}
            />
          </span>
        </p>
      )}

      {(task.reviewerName || task.deferralCount > 0 || task.attachments.length > 0) && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {task.status === "needs-review" && task.reviewerName && (
            <span className="flex items-center gap-1">
              <Eye aria-hidden className="size-3" />
              Reviewer: {task.reviewerName}
            </span>
          )}
          {task.deferralCount > 0 && (
            <span className="flex items-center gap-1" title="Times deferred">
              <Repeat aria-hidden className="size-3" />
              Deferred {task.deferralCount}×
            </span>
          )}
          {task.attachments.length > 0 && (
            <span className="flex items-center gap-1" title="Attachments">
              <Paperclip aria-hidden className="size-3" />
              <span className="sr-only">Attachments:</span>
              {task.attachments.length}
            </span>
          )}
        </p>
      )}

      <footer className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <UserAvatar name={task.ownerName} />
          <span>{task.ownerName}</span>
        </span>

        <span className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
          {task.estimatedTurnaround && (
            <span className="flex items-center gap-1" title="Estimated turnaround">
              <Timer aria-hidden className="size-3" />
              <span className="sr-only">Estimated turnaround</span>
              {formatEstimatedTurnaround(task.estimatedTurnaround)}
            </span>
          )}
          {scheduledDate && (
            <span className="flex items-center gap-1" title={scheduledDateLabel}>
              <CalendarClock aria-hidden className="size-3" />
              <span className="sr-only">{scheduledDateLabel}</span>
              {formatKanbanDate(scheduledDate)}
            </span>
          )}
          {task.dueDate && (
            <span className="flex items-center gap-1" title="Due date">
              <CalendarDays aria-hidden className="size-3" />
              <span className="sr-only">Due</span>
              {formatKanbanDate(task.dueDate)}
            </span>
          )}
        </span>
      </footer>
    </motion.article>
  );
}

export default function KanbanCard({ task, teamMembers, taskActions }: KanbanCardProps) {
  const { getTaskPermissions } = useKanbanBoard();
  const { currentUser } = useCurrentUser();
  const taskPermissions = getTaskPermissions(task);
  const isAnyActionLimited =
    !taskPermissions.canChangeOwner ||
    !taskPermissions.canEdit ||
    !taskPermissions.canRename ||
    !taskPermissions.canArchive;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !taskPermissions.canMove,
  });
  const pointerDownPositionRef = useRef<{ x: number; y: number } | null>(null);

  function handlePointerDownCard(event: PointerEvent<HTMLElement>) {
    pointerDownPositionRef.current = { x: event.clientX, y: event.clientY };
    listeners?.onPointerDown?.(event);
  }

  function handleClickCard(event: MouseEvent<HTMLElement>) {
    const pointerDownPosition = pointerDownPositionRef.current;
    const wasDragged =
      pointerDownPosition !== null &&
      Math.hypot(event.clientX - pointerDownPosition.x, event.clientY - pointerDownPosition.y) >
        CLICK_MOVEMENT_TOLERANCE_PX;

    if (!wasDragged) {
      taskActions.onOpenDetails(task);
    }
  }

  function handleKeyDownCard(event: KeyboardEvent<HTMLElement>) {
    listeners?.onKeyDown?.(event);

    // Space picks the card up for a keyboard drag; Enter opens its details.
    if (event.key === "Enter" && !isDragging && !event.defaultPrevented) {
      event.preventDefault();
      taskActions.onOpenDetails(task);
    }
  }

  return (
    <ContextMenu>
      {/* Click or Enter opens details; right-click (or the context-menu key) opens the menu; dragging moves the card. */}
      <ContextMenuTrigger
        ref={setNodeRef}
        render={<li />}
        style={{ transform: CSS.Translate.toString(transform), transition }}
        className={cn(
          "touch-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring",
          taskPermissions.canMove ? "cursor-grab" : "cursor-default",
          isDragging && "opacity-40",
        )}
        aria-label={task.title}
        data-tour="card"
        {...attributes}
        {...listeners}
        onPointerDown={handlePointerDownCard}
        onKeyDown={handleKeyDownCard}
        onClick={handleClickCard}
      >
        <KanbanCardContent task={task} />
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        <ContextMenuGroup>
          <ContextMenuLabel className="flex items-center gap-2 text-foreground">
            <UserAvatar name={task.ownerName} size="default" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{task.ownerName}</span>
              <span className="text-xs text-muted-foreground">Owner</span>
            </span>
          </ContextMenuLabel>
          <ContextMenuSub>
            <ContextMenuSubTrigger disabled={!taskPermissions.canChangeOwner}>
              <UserRoundPen aria-hidden />
              Change ownership
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuRadioGroup
                value={task.ownerName}
                onValueChange={(ownerName: string) => taskActions.onSelectOwner(task, ownerName)}
              >
                {teamMembers.map((teamMember) => (
                  <ContextMenuRadioItem key={teamMember.id} value={teamMember.name}>
                    <UserAvatar name={teamMember.name} className="size-5" />
                    {teamMember.name}
                  </ContextMenuRadioItem>
                ))}
              </ContextMenuRadioGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>

        <ContextMenuSeparator />

        <ContextMenuGroup>
          <ContextMenuItem
            disabled={!taskPermissions.canEdit}
            onClick={() => taskActions.onClickEdit(task)}
          >
            <Pencil aria-hidden />
            Edit
          </ContextMenuItem>
          <ContextMenuItem
            disabled={!taskPermissions.canRename}
            onClick={() => taskActions.onClickRename(task)}
          >
            <TextCursorInput aria-hidden />
            Rename
          </ContextMenuItem>
        </ContextMenuGroup>

        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem
            disabled={!taskPermissions.canAddUpdate}
            onClick={() => taskActions.onClickAddUpdate(task)}
          >
            <MessageSquarePlus aria-hidden />
            Add update
          </ContextMenuItem>
          {task.status === "working-on-it" && (
            <ContextMenuItem
              disabled={!taskPermissions.canPostDailyUpdate}
              onClick={() => taskActions.onClickDailyUpdate(task)}
            >
              <ClipboardCheck aria-hidden />
              Post daily update
            </ContextMenuItem>
          )}
          {task.status === "needs-review" && (
            <>
              <ContextMenuItem
                disabled={!taskPermissions.canReview}
                onClick={() => taskActions.onClickApprove(task)}
              >
                <CircleCheck aria-hidden />
                Approve
              </ContextMenuItem>
              <ContextMenuItem
                disabled={!taskPermissions.canReview}
                onClick={() => taskActions.onClickReturn(task)}
              >
                <CornerUpLeft aria-hidden />
                Return for revisions
              </ContextMenuItem>
            </>
          )}
        </ContextMenuGroup>

        <ContextMenuSeparator />

        <ContextMenuItem
          variant="destructive"
          disabled={!taskPermissions.canArchive}
          onClick={() => taskActions.onClickArchive(task)}
        >
          <Archive aria-hidden />
          Archive
        </ContextMenuItem>

        {isAnyActionLimited && (
          <>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuLabel className="flex items-start gap-1.5">
                <Lock aria-hidden className="mt-0.5 size-3 shrink-0" />
                Some actions are limited for your role ({KANBAN_ROLE_DEFINITIONS[currentUser.role].label}).
              </ContextMenuLabel>
            </ContextMenuGroup>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
