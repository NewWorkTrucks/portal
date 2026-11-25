"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { BellRing, History, Lock, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import { useDevicePreferences } from "@/components/device-preferences-provider";
import { useKanbanBoard } from "@/components/kanban/kanban-board-provider";
import { KanbanCardContent } from "@/components/kanban/kanban-card";
import KanbanBoardFilters from "@/components/kanban/kanban-board-filters";
import KanbanColumn from "@/components/kanban/kanban-column";
import KanbanOnboardingTour from "@/components/kanban/kanban-onboarding-tour";
import KanbanOpenTaskFromUrl from "@/components/kanban/kanban-open-task-from-url";
import KanbanOperationNoteDialog from "@/components/kanban/kanban-operation-note-dialog";
import KanbanStageTransitionDialog from "@/components/kanban/kanban-stage-transition-dialog";
import KanbanCardActionsDialog from "@/components/kanban/kanban-card-actions-dialog";
import KanbanTaskCreateDialog from "@/components/kanban/kanban-task-create-dialog";
import KanbanTaskDetailsPanel from "@/components/kanban/kanban-task-details-panel";
import KanbanTaskEditDialog from "@/components/kanban/kanban-task-edit-dialog";
import KanbanTaskList from "@/components/kanban/kanban-task-list";
import KanbanTaskRenameDialog from "@/components/kanban/kanban-task-rename-dialog";
import { buttonVariants, Button } from "@/components/ui/button";
import { DEFAULT_KANBAN_BOARD_VIEW } from "@/constants/kanban-board-views";
import { KANBAN_BOARD_NAME, KANBAN_COLUMN_COUNT, KANBAN_COLUMNS } from "@/constants/kanban-columns";
import { EMPTY_KANBAN_TASK_FILTERS } from "@/constants/kanban-filters";
import { KANBAN_ROLE_DEFINITIONS } from "@/constants/kanban-role-capabilities";
import {
  findStatusOfDraggable,
  findSubtasksOf,
  findTaskById,
  getColumnTitle,
  moveTaskToStatus,
  reorderTaskWithinStatus,
} from "@/lib/kanban";
import { celebrateCardDone } from "@/lib/confetti";
import { filterKanbanTasksByStatus } from "@/lib/kanban-filters";
import { getTaskReviewerName } from "@/lib/kanban-permissions";
import type { KanbanAttachment } from "@/types/attachment";
import type { KanbanTaskFilters } from "@/types/kanban-filters";
import type { KanbanDailyUpdate, KanbanStageTransition } from "@/types/kanban-stages";
import type {
  KanbanBoardView,
  KanbanNoteOnlyOperation,
  KanbanPendingNoteOperation,
  KanbanStageOperation,
  KanbanStatus,
  KanbanTask,
  KanbanTaskActions,
  KanbanTaskDialogKind,
  KanbanTaskFormValues,
  KanbanTasksByStatus,
} from "@/types/kanban";

const POINTER_ACTIVATION_DISTANCE_PX = 5;
// Long enough for the stage and card entrance to finish on a seven-stage board.
const ENTRANCE_DURATION_MS = 3000;

const KEYBOARD_DRAG_CODES = {
  start: ["Space"],
  cancel: ["Escape"],
  end: ["Space", "Enter"],
};

const SCREEN_READER_INSTRUCTIONS = {
  draggable:
    "Press Enter to open this card's details. To move it, press Space, use the arrow keys, then press Space again to drop it or Escape to cancel.",
};

export default function KanbanBoard() {
  const {
    teamMembers,
    mentionables,
    tasksByStatus,
    allTasksByStatus,
    setTasksByStatus,
    createTask,
    updateTask,
    renameTask,
    changeTaskOwner,
    archiveTask,
    transitionTask,
    reorderTask,
    postDailyUpdate,
    addTaskUpdate,
    attachFiles,
    removeAttachment,
    assignableTeamMembers,
    getTaskPermissions,
    getMoveDeniedReason,
  } = useKanbanBoard();
  const { currentUser } = useCurrentUser();
  const { isDoneColumnHidden, isLowSpecModeOn } = useDevicePreferences();
  const dndContextId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: POINTER_ACTIVATION_DISTANCE_PX } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter is reserved for opening a card's details, so only Space starts a keyboard drag.
      keyboardCodes: KEYBOARD_DRAG_CODES,
    }),
  );

  // The first-load entrance (stages, then cards) plays once; moves and live updates never replay it.
  const [isEntering, setIsEntering] = useState(true);
  const [selectedView, setSelectedView] = useState<KanbanBoardView>(DEFAULT_KANBAN_BOARD_VIEW);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [tasksBeforeDrag, setTasksBeforeDrag] = useState<KanbanTasksByStatus | null>(null);
  const [blockedMoveNotice, setBlockedMoveNotice] = useState<string | null>(null);
  const [taskFilters, setTaskFilters] = useState<KanbanTaskFilters>(EMPTY_KANBAN_TASK_FILTERS);
  const [openDialogKind, setOpenDialogKind] = useState<KanbanTaskDialogKind | null>(null);
  // Kept after a dialog closes so its content doesn't vanish during the exit animation.
  const [dialogTask, setDialogTask] = useState<KanbanTask | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isCardActionsDialogOpen, setIsCardActionsDialogOpen] = useState(false);
  // Kept after the dialog closes, so its content stays during the exit animation.
  const [cardActionsTaskId, setCardActionsTaskId] = useState<string | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  // Kept after the panel closes, so its content stays during the exit animation.
  const [detailsTaskId, setDetailsTaskId] = useState<string | null>(null);
  // Kept after the note dialog closes, for the same exit-animation reason as dialogTask.
  const [pendingNoteOperation, setPendingNoteOperation] =
    useState<KanbanPendingNoteOperation | null>(null);
  const lastDragOverIdRef = useRef<UniqueIdentifier | null>(null);
  const isColumnMoveSettlingRef = useRef(false);
  const columnMoveSettleFrameRef = useRef<number | null>(null);

  const activeTask = useMemo(
    () => (activeTaskId ? findTaskById(tasksByStatus, activeTaskId) : undefined),
    [activeTaskId, tasksByStatus],
  );
  const cardActionsTask = useMemo(
    () => (cardActionsTaskId ? (findTaskById(tasksByStatus, cardActionsTaskId) ?? null) : null),
    [cardActionsTaskId, tasksByStatus],
  );

  // E1-6: only matching cards are shown; dragging and saving still work on the full board.
  const visibleTasksByStatus = useMemo(
    () => filterKanbanTasksByStatus(tasksByStatus, taskFilters),
    [tasksByStatus, taskFilters],
  );
  const visibleColumns = useMemo(
    () =>
      taskFilters.statuses.length > 0
        ? KANBAN_COLUMNS.filter((column) => taskFilters.statuses.includes(column.status))
        : // Settings can hide Done; filtering by Done still shows it.
          KANBAN_COLUMNS.filter((column) => !(isDoneColumnHidden && column.status === "done")),
    [taskFilters.statuses, isDoneColumnHidden],
  );
  const visibleListTasks = useMemo(
    () => visibleColumns.flatMap((column) => visibleTasksByStatus[column.status]),
    [visibleColumns, visibleTasksByStatus],
  );
  const totalTaskCount = useMemo(
    () => Object.values(tasksByStatus).reduce((taskCount, tasks) => taskCount + tasks.length, 0),
    [tasksByStatus],
  );

  useEffect(() => {
    // Waits for the first cards, so a board that loads slowly still gets its entrance.
    if (!isEntering || totalTaskCount === 0) {
      return;
    }
    const entranceTimer = setTimeout(() => setIsEntering(false), ENTRANCE_DURATION_MS);
    return () => clearTimeout(entranceTimer);
  }, [isEntering, totalTaskCount]);

  // The dragged card as it was when picked up, so permissions use its original column.
  const draggedTaskAtStart = useMemo(
    () => (activeTaskId && tasksBeforeDrag ? findTaskById(tasksBeforeDrag, activeTaskId) : undefined),
    [activeTaskId, tasksBeforeDrag],
  );

  // Looked up live, so the panel reflects edits, moves and owner changes while it is open.
  const detailsTask = useMemo(
    () => (detailsTaskId ? (findTaskById(tasksByStatus, detailsTaskId) ?? null) : null),
    [detailsTaskId, tasksByStatus],
  );

  // The open card's parent and subtasks, from the same live lookup.
  const detailsParentTask = useMemo(
    () => (detailsTask?.parentTaskId ? (findTaskById(tasksByStatus, detailsTask.parentTaskId) ?? null) : null),
    [detailsTask, tasksByStatus],
  );
  const detailsSubtasks = useMemo(
    () => (detailsTask ? findSubtasksOf(tasksByStatus, detailsTask.id) : []),
    [detailsTask, tasksByStatus],
  );

  const dragAnnouncements = useMemo<Announcements>(() => {
    function describeTask(taskId: string | number) {
      return findTaskById(tasksByStatus, String(taskId))?.title ?? "Task";
    }

    function describeColumn(draggableId: string | number) {
      const status = findStatusOfDraggable(tasksByStatus, String(draggableId));
      return status ? getColumnTitle(status) : "the board";
    }

    return {
      onDragStart: ({ active }) =>
        `Picked up ${describeTask(active.id)} in ${describeColumn(active.id)}.`,
      onDragOver: ({ active, over }) =>
        over ? `${describeTask(active.id)} is over ${describeColumn(over.id)}.` : undefined,
      onDragEnd: ({ active, over }) =>
        over
          ? `Dropped ${describeTask(active.id)} in ${describeColumn(over.id)}.`
          : `Dropped ${describeTask(active.id)}.`,
      onDragCancel: ({ active }) =>
        `Cancelled moving ${describeTask(active.id)}. It was returned to its original column.`,
    };
  }, [tasksByStatus]);

  function handleSelectView(view: KanbanBoardView) {
    setSelectedView(view);
    setBlockedMoveNotice(null);
  }

  function cancelColumnMoveSettling() {
    if (columnMoveSettleFrameRef.current !== null) {
      cancelAnimationFrame(columnMoveSettleFrameRef.current);
      columnMoveSettleFrameRef.current = null;
    }
    isColumnMoveSettlingRef.current = false;
  }

  /** Holds the drag target until the moved card has been laid out (two frames). */
  function holdDragTargetUntilLayoutSettles() {
    cancelColumnMoveSettling();
    isColumnMoveSettlingRef.current = true;
    columnMoveSettleFrameRef.current = requestAnimationFrame(() => {
      columnMoveSettleFrameRef.current = requestAnimationFrame(() => {
        columnMoveSettleFrameRef.current = null;
        isColumnMoveSettlingRef.current = false;
      });
    });
  }

  function handleClickShowReviews() {
    setTaskFilters({ ...EMPTY_KANBAN_TASK_FILTERS, statuses: ["needs-review"] });
  }

  function resetDragState() {
    cancelColumnMoveSettling();
    lastDragOverIdRef.current = null;
    setActiveTaskId(null);
    setTasksBeforeDrag(null);
  }

  function getDropBlockedReason(status: KanbanStatus): string | null {
    if (!draggedTaskAtStart || status === draggedTaskAtStart.status) {
      return null;
    }

    return getMoveDeniedReason(draggedTaskAtStart, status);
  }

  function handleDragStart({ active }: DragStartEvent) {
    setBlockedMoveNotice(null);
    setActiveTaskId(String(active.id));
    // Snapshot every business's cards, so cancelling restores the full board state.
    setTasksBeforeDrag(allTasksByStatus);
  }

  // Moves the card into another column while it is still being dragged, so the
  // target column opens a gap for it (Trello-style live preview).
  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    const translatedActiveRect = active.rect.current.translated;
    const isBelowOverItem =
      translatedActiveRect !== null && translatedActiveRect.top > over.rect.top + over.rect.height / 2;

    const overStatusBeforeMove = findStatusOfDraggable(tasksByStatus, overId);
    const dropBlockedReason = overStatusBeforeMove ? getDropBlockedReason(overStatusBeforeMove) : null;

    // Never preview the card in a column the current role can't move it to.
    if (dropBlockedReason) {
      setBlockedMoveNotice(dropBlockedReason);
      return;
    }

    const activeStatusBeforeMove = findStatusOfDraggable(tasksByStatus, activeId);
    if (activeStatusBeforeMove && overStatusBeforeMove && activeStatusBeforeMove !== overStatusBeforeMove) {
      holdDragTargetUntilLayoutSettles();
    }

    setTasksByStatus((previousTasksByStatus) => {
      const activeStatus = findStatusOfDraggable(previousTasksByStatus, activeId);
      const overStatus = findStatusOfDraggable(previousTasksByStatus, overId);

      if (!activeStatus || !overStatus || activeStatus === overStatus) {
        return previousTasksByStatus;
      }

      const overTasks = previousTasksByStatus[overStatus];
      const overTaskIndex = overTasks.findIndex((task) => task.id === overId);
      const targetIndex =
        overTaskIndex < 0 ? overTasks.length : overTaskIndex + (isBelowOverItem ? 1 : 0);

      return moveTaskToStatus(previousTasksByStatus, activeId, overStatus, targetIndex);
    });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const activeId = String(active.id);
    const previousStatus = tasksBeforeDrag
      ? findStatusOfDraggable(tasksBeforeDrag, activeId)
      : undefined;

    if (over) {
      const overId = String(over.id);
      const overStatus = findStatusOfDraggable(tasksByStatus, overId);
      const activeStatus = findStatusOfDraggable(tasksByStatus, activeId);

      // A reorder within the starting column isn't a status change; save the new order only.
      if (activeStatus && activeStatus === overStatus && activeStatus === previousStatus && activeId !== overId) {
        const reorderedTasksByStatus = reorderTaskWithinStatus(tasksByStatus, activeStatus, activeId, overId);
        void reorderTask(
          activeId,
          reorderedTasksByStatus[activeStatus].map((task) => task.id),
        );
      }

      setTasksByStatus((previousTasksByStatus) => {
        const activeStatus = findStatusOfDraggable(previousTasksByStatus, activeId);
        const overStatus = findStatusOfDraggable(previousTasksByStatus, overId);

        if (!activeStatus || activeStatus !== overStatus) {
          return previousTasksByStatus;
        }

        return reorderTaskWithinStatus(previousTasksByStatus, activeStatus, activeId, overId);
      });
    }

    const newStatus = findStatusOfDraggable(tasksByStatus, activeId);
    const movedTask = findTaskById(tasksByStatus, activeId);

    // A status change needs a note before it is saved; until then the card sits in its new
    // column as a preview, and cancelling the note dialog puts it back.
    if (tasksBeforeDrag && previousStatus && newStatus && movedTask && previousStatus !== newStatus) {
      openNoteDialog({
        kind: "move",
        task: movedTask,
        previousStatus,
        newStatus,
        tasksBeforeMove: tasksBeforeDrag,
      });
    }

    resetDragState();
  }

  function handleDragCancel() {
    if (tasksBeforeDrag) {
      setTasksByStatus(tasksBeforeDrag);
    }

    resetDragState();
  }

  function openTaskDialog(dialogKind: KanbanTaskDialogKind, task: KanbanTask | null) {
    setDialogTask(task);
    setOpenDialogKind(dialogKind);
  }

  function handleDialogOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setOpenDialogKind(null);
    }
  }

  // A create dialog opened with a card is adding a subtask to that card.
  async function handleSubmitCreateTask(formValues: KanbanTaskFormValues) {
    await createTask(formValues, dialogTask?.id);
    setOpenDialogKind(null);
  }

  async function handleSubmitEditTask(formValues: KanbanTaskFormValues) {
    if (!dialogTask) {
      return;
    }

    await updateTask(dialogTask, formValues);
    setOpenDialogKind(null);
  }

  async function handleSubmitRenameTask(title: string, note: string) {
    if (!dialogTask) {
      return;
    }

    await renameTask(dialogTask, title, note);
    setOpenDialogKind(null);
  }

  function openNoteDialog(noteOperation: KanbanPendingNoteOperation) {
    setPendingNoteOperation(noteOperation);
    setIsNoteDialogOpen(true);
  }

  /** Updates and attachment operations start in the details panel, so it reopens when they finish. */
  function reopenDetailsPanelAfter(noteOperation: KanbanPendingNoteOperation) {
    if (
      noteOperation.kind === "add-update" ||
      noteOperation.kind === "attach-files" ||
      noteOperation.kind === "remove-attachment"
    ) {
      openDetailsPanel(noteOperation.task);
    }
  }

  function handleNoteDialogOpenChange(isOpen: boolean) {
    if (isOpen || !pendingNoteOperation) {
      return;
    }

    // Cancelling a drag puts the card back where it was.
    if (pendingNoteOperation.kind === "move" && pendingNoteOperation.tasksBeforeMove) {
      setTasksByStatus(pendingNoteOperation.tasksBeforeMove);
    }
    setIsNoteDialogOpen(false);
    reopenDetailsPanelAfter(pendingNoteOperation);
  }

  function closeNoteDialogAfterSave() {
    setIsNoteDialogOpen(false);
    if (pendingNoteOperation) {
      reopenDetailsPanelAfter(pendingNoteOperation);
    }
  }

  async function handleConfirmNoteOperation(note: string, files: File[]) {
    if (!pendingNoteOperation) {
      return;
    }

    switch (pendingNoteOperation.kind) {
      case "change-owner":
        await changeTaskOwner(pendingNoteOperation.task, pendingNoteOperation.newOwnerName, note);
        break;
      case "archive":
        await archiveTask(pendingNoteOperation.task, note);
        break;
      case "add-update":
        await addTaskUpdate(pendingNoteOperation.task, note, files);
        break;
      case "attach-files":
        await attachFiles(pendingNoteOperation.task, pendingNoteOperation.files, note);
        break;
      case "remove-attachment":
        await removeAttachment(pendingNoteOperation.task, pendingNoteOperation.attachment, note);
        break;
    }

    closeNoteDialogAfterSave();
  }

  async function handleConfirmStageTransition(transition: KanbanStageTransition, files: File[]) {
    if (pendingNoteOperation?.kind !== "move") {
      return;
    }

    const movedTaskId = pendingNoteOperation.task.id;
    await transitionTask(movedTaskId, pendingNoteOperation.previousStatus, transition, files);
    closeNoteDialogAfterSave();
    // Confetti from the card once it lands in Done (drag, Approve and Change status all end here).
    if (transition.status === "done" && !isLowSpecModeOn) {
      void celebrateCardDone(movedTaskId);
    }
  }

  async function handleConfirmDailyUpdate(dailyUpdate: KanbanDailyUpdate, files: File[]) {
    if (pendingNoteOperation?.kind !== "daily-update") {
      return;
    }

    await postDailyUpdate(pendingNoteOperation.task, dailyUpdate, files);
    closeNoteDialogAfterSave();
  }

  function handleSelectTaskOwner(task: KanbanTask, newOwnerName: string) {
    if (task.ownerName !== newOwnerName) {
      openNoteDialog({ kind: "change-owner", task, newOwnerName });
    }
  }

  /** A move without a drag (review decisions and the touch menu): the card moves once its form is saved. */
  function openStatusChange(task: KanbanTask, newStatus: KanbanStatus) {
    openNoteDialog({
      kind: "move",
      task,
      previousStatus: task.status,
      newStatus,
      tasksBeforeMove: null,
    });
  }

  function openCardActions(task: KanbanTask) {
    setCardActionsTaskId(task.id);
    setIsCardActionsDialogOpen(true);
  }

  function openDetailsPanel(task: KanbanTask) {
    setDetailsTaskId(task.id);
    setIsDetailsPanelOpen(true);
  }

  function handleClickAddSubtask(parentTask: KanbanTask) {
    openTaskDialog("create", parentTask);
  }

  const kanbanTaskActions: KanbanTaskActions = {
    onOpenDetails: openDetailsPanel,
    onOpenCardActions: openCardActions,
    onSelectStatus: openStatusChange,
    onClickEdit: (task) => openTaskDialog("edit", task),
    onClickRename: (task) => openTaskDialog("rename", task),
    onClickArchive: (task) => openNoteDialog({ kind: "archive", task }),
    onSelectOwner: handleSelectTaskOwner,
    onClickDailyUpdate: (task) => openNoteDialog({ kind: "daily-update", task }),
    onClickAddUpdate: (task) => openNoteDialog({ kind: "add-update", task }),
    onClickApprove: (task) => openStatusChange(task, "done"),
    onClickReturn: (task) => openStatusChange(task, "working-on-it"),
    onSelectAttachments: (task: KanbanTask, files: File[]) =>
      openNoteDialog({ kind: "attach-files", task, files }),
    onClickRemoveAttachment: (task: KanbanTask, attachment: KanbanAttachment) =>
      openNoteDialog({ kind: "remove-attachment", task, attachment }),
  };

  // Actions started from the panel close it first, so only one modal is open at a time.
  const detailsPanelTaskActions: KanbanTaskActions = {
    ...kanbanTaskActions,
    onClickEdit: closeDetailsPanelThen(kanbanTaskActions.onClickEdit),
    onClickRename: closeDetailsPanelThen(kanbanTaskActions.onClickRename),
    onClickArchive: closeDetailsPanelThen(kanbanTaskActions.onClickArchive),
    onSelectOwner: closeDetailsPanelThen(kanbanTaskActions.onSelectOwner),
    onClickDailyUpdate: closeDetailsPanelThen(kanbanTaskActions.onClickDailyUpdate),
    onClickAddUpdate: closeDetailsPanelThen(kanbanTaskActions.onClickAddUpdate),
    onClickApprove: closeDetailsPanelThen(kanbanTaskActions.onClickApprove),
    onClickReturn: closeDetailsPanelThen(kanbanTaskActions.onClickReturn),
    onSelectAttachments: closeDetailsPanelThen(kanbanTaskActions.onSelectAttachments),
    onClickRemoveAttachment: closeDetailsPanelThen(kanbanTaskActions.onClickRemoveAttachment),
  };

  function closeDetailsPanelThen<ActionArguments extends unknown[]>(
    taskAction: (...actionArguments: ActionArguments) => void,
  ) {
    return (...actionArguments: ActionArguments) => {
      setIsDetailsPanelOpen(false);
      taskAction(...actionArguments);
    };
  }

  // US-4.2: the reviewer is whoever assigned the card, never a free choice.
  const pendingTaskReviewerName = pendingNoteOperation
    ? getTaskReviewerName(pendingNoteOperation.task, teamMembers)
    : null;
  // US-4.3: reviews waiting on the current user are called out above the board.
  const reviewsWaitingForCurrentUser = tasksByStatus["needs-review"].filter(
    (task) => task.reviewerName === currentUser.name,
  ).length;
  // G6: the edit form lists people you can assign, plus the current owner so the field still shows them.
  const editDialogOwnerOptions = teamMembers.filter(
    (teamMember) =>
      assignableTeamMembers.includes(teamMember) || teamMember.name === dialogTask?.ownerName,
  );
  const canCreateTasks = KANBAN_ROLE_DEFINITIONS[currentUser.role].capabilities.canCreateTasks;
  const stageOperation: KanbanStageOperation | null =
    pendingNoteOperation?.kind === "move" || pendingNoteOperation?.kind === "daily-update"
      ? pendingNoteOperation
      : null;
  // Attaching files to an update follows the card's attachment rule (owner, department head, admin).
  const canAttachFilesToPendingTask = pendingNoteOperation
    ? getTaskPermissions(pendingNoteOperation.task).canManageAttachments
    : false;
  const noteOnlyOperation: KanbanNoteOnlyOperation | null =
    pendingNoteOperation && !stageOperation ? (pendingNoteOperation as KanbanNoteOnlyOperation) : null;

  // Moving a card shifts the columns under the pointer. Keeping the same target until that
  // settles stops the card bouncing between two columns in an endless update loop.
  const detectDragCollisions = useCallback<CollisionDetection>((collisionArguments) => {
    if (isColumnMoveSettlingRef.current && lastDragOverIdRef.current !== null) {
      return [{ id: lastDragOverIdRef.current }];
    }
    const collisions = closestCorners(collisionArguments);
    lastDragOverIdRef.current = collisions[0]?.id ?? null;
    return collisions;
  }, []);

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={detectDragCollisions}
      accessibility={{
        announcements: dragAnnouncements,
        screenReaderInstructions: SCREEN_READER_INSTRUCTIONS,
      }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <header className="flex flex-wrap items-end justify-between gap-4 px-4 pt-6 pb-4 sm:px-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{KANBAN_BOARD_NAME}</h1>
          <p className="text-sm text-muted-foreground">
            {KANBAN_COLUMN_COUNT} statuses.{" "}
            {selectedView === "board" ? (
              <>
                <span className="pointer-coarse:hidden">
                  Drag cards to change status or reorder. Right-click a card for more actions.
                </span>
                <span className="hidden pointer-coarse:inline">Hold a card to change its status or see more actions.</span>
              </>
            ) : (
              "Open a row for details. Use its actions menu to change status."
            )}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 px-4 pb-4 sm:px-6">
        {canCreateTasks && (
          <Button data-tour="new-task" onClick={() => openTaskDialog("create", null)}>
            <Plus aria-hidden />
            New task
          </Button>
        )}
        {reviewsWaitingForCurrentUser > 0 && (
          <Button
            variant="outline"
            className="border-red-300 bg-red-50 text-red-900 hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300"
            onClick={handleClickShowReviews}
          >
            <BellRing aria-hidden />
            {reviewsWaitingForCurrentUser === 1
              ? "1 card needs your review"
              : `${reviewsWaitingForCurrentUser} cards need your review`}
          </Button>
        )}
        {/* TODO: Temporary route. Move the audit log to its own page in the portal navigation. */}
        <Link
          href="/kanban/audit-log"
          data-tour="audit-log"
          className={buttonVariants({ variant: "outline" })}
        >
          <History aria-hidden />
          Audit log
        </Link>
        <p role="status" className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          {blockedMoveNotice && (
            <>
              <Lock aria-hidden className="size-3.5 shrink-0" />
              {blockedMoveNotice}
            </>
          )}
        </p>
      </div>

      <KanbanBoardFilters
        filters={taskFilters}
        onChangeFilters={setTaskFilters}
        teamMembers={teamMembers}
        selectedView={selectedView}
        onSelectView={handleSelectView}
      />

      {selectedView === "board" ? (
        <div data-tour="board-columns" className="flex min-h-0 flex-1 scroll-px-4 gap-4 overflow-x-auto px-4 pb-6 max-md:snap-x max-md:snap-proximity sm:px-6">
          {visibleColumns.map((column, columnIndex) => (
            <KanbanColumn
              key={column.status}
              entranceColumnIndex={isEntering ? columnIndex : undefined}
              column={column}
              tasks={visibleTasksByStatus[column.status]}
              totalTaskCount={tasksByStatus[column.status].length}
              taskActions={kanbanTaskActions}
              dropBlockedReason={getDropBlockedReason(column.status)}
            />
          ))}
        </div>
      ) : (
        <KanbanTaskList
          tasks={visibleListTasks}
          totalTaskCount={totalTaskCount}
          taskActions={kanbanTaskActions}
        />
      )}

      <DragOverlay>{activeTask ? <KanbanCardContent task={activeTask} isOverlay /> : null}</DragOverlay>

      <KanbanOnboardingTour />
      {/* Reads ?task= from a notification link; suspended so the board still prerenders. */}
      <Suspense fallback={null}>
        <KanbanOpenTaskFromUrl tasksByStatus={tasksByStatus} onOpenTask={openDetailsPanel} />
      </Suspense>

      <KanbanCardActionsDialog
        task={cardActionsTask}
        taskActions={kanbanTaskActions}
        isOpen={isCardActionsDialogOpen && cardActionsTask !== null}
        onOpenChange={setIsCardActionsDialogOpen}
      />
      <KanbanTaskDetailsPanel
        task={detailsTask}
        taskActions={detailsPanelTaskActions}
        parentTask={detailsParentTask}
        subtasks={detailsSubtasks}
        onOpenTask={openDetailsPanel}
        onClickAddSubtask={handleClickAddSubtask}
        isOpen={isDetailsPanelOpen && detailsTask !== null}
        onOpenChange={setIsDetailsPanelOpen}
      />
      <KanbanTaskCreateDialog
        parentTask={dialogTask}
        mentionables={mentionables}
        teamMembers={assignableTeamMembers}
        isOpen={openDialogKind === "create"}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleSubmitCreateTask}
      />
      <KanbanTaskEditDialog
        mentionables={mentionables}
        canChangeOwner={dialogTask ? getTaskPermissions(dialogTask).canChangeOwner : false}
        task={dialogTask}
        teamMembers={editDialogOwnerOptions}
        isOpen={openDialogKind === "edit"}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleSubmitEditTask}
      />
      <KanbanTaskRenameDialog
        mentionables={mentionables}
        task={dialogTask}
        isOpen={openDialogKind === "rename"}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleSubmitRenameTask}
      />
      <KanbanOperationNoteDialog
        mentionables={mentionables}
        operation={noteOnlyOperation}
        isOpen={isNoteDialogOpen && noteOnlyOperation !== null}
        onOpenChange={handleNoteDialogOpenChange}
        canAttachFiles={canAttachFilesToPendingTask}
        onConfirm={handleConfirmNoteOperation}
      />
      <KanbanStageTransitionDialog
        operation={stageOperation}
        reviewerName={pendingTaskReviewerName}
        mentionables={mentionables}
        isOpen={isNoteDialogOpen && stageOperation !== null}
        onOpenChange={handleNoteDialogOpenChange}
        canAttachFiles={canAttachFilesToPendingTask}
        onConfirmTransition={handleConfirmStageTransition}
        onConfirmDailyUpdate={handleConfirmDailyUpdate}
      />
    </DndContext>
  );
}
