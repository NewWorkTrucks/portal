"use client";

import { useSortable } from "@dnd-kit/sortable";
import { type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent, useEffect, useMemo, useRef } from "react";
import { CSS } from "@dnd-kit/utilities";
import { motion, type TargetAndTransition, type Transition } from "framer-motion";
import {
  ClockAlert,
  CalendarClock,
  CornerUpLeft,
  Eye,
  BellRing,
  Paperclip,
  Repeat,
  CalendarDays,
  MessageSquareText,
  Timer,
} from "lucide-react";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useCurrentUser } from "@/components/current-user-provider";
import { useDevicePreferences } from "@/components/device-preferences-provider";
import { useKanbanBoard } from "@/components/kanban/kanban-board-provider";
import KanbanSubtaskProgress from "@/components/kanban/kanban-subtask-progress";
import KanbanTaskContextMenuContent from "@/components/kanban/kanban-task-context-menu-content";
import MentionText from "@/components/mention-text";
import { toPlainNoteText } from "@/lib/rich-note";
import UserAvatar from "@/components/user-avatar";
import { KANBAN_PRIORITY_BADGE_CLASS_NAMES } from "@/constants/kanban-task-priorities";
import { cn } from "@/lib/utils";
import { findSubtasksOf, formatEstimatedTurnaround, formatKanbanDate, getSubtaskProgress } from "@/lib/kanban";
import type { KanbanTask, KanbanTaskActions } from "@/types/kanban";
import type { KanbanEntrance } from "@/types/kanban-entrance";

// A pointer that moves further than this between press and release was a drag, not a click.
const CLICK_MOVEMENT_TOLERANCE_PX = 5;
// Holding a finger on a card this long opens its actions. Moving further than the tolerance scrolls instead.
const LONG_PRESS_DELAY_MS = 450;
// How long after the finger lifts a stray click can still arrive and must not dismiss the dialog.
const RELEASE_CLICK_WINDOW_MS = 350;

type KanbanCardProps = {
  task: KanbanTask;
  taskActions: KanbanTaskActions;
  /** Set during the board's first-load entrance, so the card fades in after its stage. */
  entrance?: KanbanEntrance;
};

// Hover lift for cards in a column. Translate only: scale or rotate would skew dnd-kit's measurements.
const CARD_HOVER_LIFT: TargetAndTransition = { y: -3 };
const CARD_HOVER_TRANSITION: Transition = { type: "spring", stiffness: 500, damping: 30 };

type KanbanCardContentProps = {
  task: KanbanTask;
  isOverlay?: boolean;
  entrance?: KanbanEntrance;
};

/** Visual body of a card, shared by the in-column card and the drag overlay. */
export function KanbanCardContent({ task, isOverlay = false, entrance }: KanbanCardContentProps) {
  const { mentionables, tasksByStatus } = useKanbanBoard();
  const { currentUser } = useCurrentUser();
  const { isLowSpecModeOn } = useDevicePreferences();

  const subtaskProgress = useMemo(
    () => (task.parentTaskId ? null : getSubtaskProgress(findSubtasksOf(tasksByStatus, task.id))),
    [task.id, task.parentTaskId, tasksByStatus],
  );

  // The drag overlay and low spec mode get no hover animation.
  const hasHoverEffect = !isOverlay && !isLowSpecModeOn;
  const scheduledDate = task.followUpDate ?? task.revisitDate;
  const scheduledDateLabel = task.followUpDate ? "Follow up" : "Revisit";

  return (
    <motion.article
      whileHover={hasHoverEffect ? CARD_HOVER_LIFT : undefined}
      transition={CARD_HOVER_TRANSITION}
      style={
        entrance
          ? ({ "--board-enter-index": entrance.columnIndex, "--board-card-index": entrance.cardIndex } as CSSProperties)
          : undefined
      }
      className={cn(
        entrance && "board-enter-card",
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
            KANBAN_PRIORITY_BADGE_CLASS_NAMES[task.priority],
          )}
        >
          {task.priority}
        </span>
      </header>

      <p className="line-clamp-2 text-xs text-muted-foreground">{task.description}</p>

      {task.status === "working-on-it" && task.dailyUpdateMissedOn && (
        <p
          title="No daily update by 6:00 PM Central. Post a daily update to clear this."
          className="flex w-fit items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-500/15 dark:text-amber-300"
        >
          <ClockAlert aria-hidden className="size-3" />
          Update missed
        </p>
      )}

      {task.status === "needs-review" && task.reviewerName === currentUser.name && (
        <p className="flex w-fit items-center gap-1 rounded-md bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-900 dark:bg-red-500/20 dark:text-red-300">
          <BellRing aria-hidden className="size-3" />
          Needs your review
        </p>
      )}

      {task.status === "working-on-it" && task.revisionNotes && (
        <p className="flex gap-1.5 rounded-md bg-amber-100 px-2 py-1.5 text-xs text-amber-900 dark:bg-amber-500/15 dark:text-amber-300">
          <CornerUpLeft aria-hidden className="mt-0.5 size-3 shrink-0" />
          <span className="line-clamp-2">
            <strong className="font-semibold">Returned for revisions:</strong>{" "}
            {toPlainNoteText(task.revisionNotes)}
          </span>
        </p>
      )}

      {task.latestNote && task.latestNote !== task.revisionNotes && (
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

      {subtaskProgress && subtaskProgress.totalCount > 0 && <KanbanSubtaskProgress subtaskProgress={subtaskProgress} />}

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

export default function KanbanCard({ task, taskActions, entrance }: KanbanCardProps) {
  const { getTaskPermissions } = useKanbanBoard();
  const taskPermissions = getTaskPermissions(task);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !taskPermissions.canMove,
  });
  const pointerDownPositionRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTouchPressActiveRef = useRef(false);
  const wasLongPressedRef = useRef(false);
  const stopBlockingReleaseClickRef = useRef<(() => void) | null>(null);

  function cancelLongPress() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  // The dialog opens under the finger, so the click from lifting it would land on the backdrop and close it.
  function blockReleaseClick() {
    function handleReleaseClick(event: globalThis.MouseEvent) {
      event.preventDefault();
      event.stopPropagation();
      stopBlocking();
    }
    function stopBlocking() {
      window.removeEventListener("click", handleReleaseClick, true);
      stopBlockingReleaseClickRef.current = null;
    }
    window.addEventListener("click", handleReleaseClick, true);
    stopBlockingReleaseClickRef.current = stopBlocking;
  }

  function handleEndPointerPress() {
    cancelLongPress();
    isTouchPressActiveRef.current = false;
    const stopBlockingReleaseClick = stopBlockingReleaseClickRef.current;
    if (stopBlockingReleaseClick) {
      setTimeout(stopBlockingReleaseClick, RELEASE_CLICK_WINDOW_MS);
    }
  }

  function handlePointerDownCard(event: PointerEvent<HTMLElement>) {
    pointerDownPositionRef.current = { x: event.clientX, y: event.clientY };
    wasLongPressedRef.current = false;
    cancelLongPress();

    // Touch never drags: a swipe scrolls the board, and holding opens the card's actions.
    if (event.pointerType !== "mouse") {
      isTouchPressActiveRef.current = true;
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        wasLongPressedRef.current = true;
        blockReleaseClick();
        taskActions.onOpenCardActions(task);
      }, LONG_PRESS_DELAY_MS);
      return;
    }

    isTouchPressActiveRef.current = false;
    listeners?.onPointerDown?.(event);
  }

  function handlePointerMoveCard(event: PointerEvent<HTMLElement>) {
    const pointerDownPosition = pointerDownPositionRef.current;
    if (
      longPressTimerRef.current &&
      pointerDownPosition &&
      Math.hypot(event.clientX - pointerDownPosition.x, event.clientY - pointerDownPosition.y) >
        CLICK_MOVEMENT_TOLERANCE_PX
    ) {
      cancelLongPress();
    }
  }

  function handleClickCard(event: MouseEvent<HTMLElement>) {
    if (wasLongPressedRef.current) {
      wasLongPressedRef.current = false;
      return;
    }

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

  useEffect(
    () => () => {
      cancelLongPress();
      stopBlockingReleaseClickRef.current?.();
    },
    [],
  );

  return (
    <ContextMenu>
      {/* Click or Enter opens details; right-click (or the context-menu key) opens the menu; dragging moves the card.
          On touch, tap opens details, swipe scrolls, and holding opens the actions dialog instead of this menu. */}
      <ContextMenuTrigger
        ref={setNodeRef}
        render={<li />}
        style={{ transform: CSS.Translate.toString(transform), transition }}
        className={cn(
          "kanban-card-press-target touch-manipulation rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring",
          taskPermissions.canMove ? "cursor-grab" : "cursor-default",
          isDragging && "opacity-40",
        )}
        aria-label={task.title}
        data-tour="card"
        data-task-id={task.id}
        {...attributes}
        {...listeners}
        onPointerDown={handlePointerDownCard}
        onPointerMove={handlePointerMoveCard}
        onPointerUp={handleEndPointerPress}
        onPointerCancel={handleEndPointerPress}
        onTouchStart={(event) => event.preventBaseUIHandler()}
        // Stops the browser's own image and link drag; card moves use dnd-kit.
        onDragStart={(event) => event.preventDefault()}
        onContextMenu={(event) => {
          const isTouchContextMenu =
            isTouchPressActiveRef.current ||
            wasLongPressedRef.current ||
            (event.nativeEvent as globalThis.PointerEvent).pointerType === "touch";
          if (isTouchContextMenu) {
            event.preventDefault();
            event.preventBaseUIHandler();
          }
        }}
        onKeyDown={handleKeyDownCard}
        onClick={handleClickCard}
      >
        <KanbanCardContent task={task} entrance={entrance} />
      </ContextMenuTrigger>

      <KanbanTaskContextMenuContent task={task} taskActions={taskActions} />
    </ContextMenu>
  );
}
