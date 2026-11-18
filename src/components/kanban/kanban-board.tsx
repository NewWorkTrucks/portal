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
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { History, Lock, Plus } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { useKanbanBoard } from "@/components/kanban/kanban-board-provider";
import { KanbanCardContent } from "@/components/kanban/kanban-card";
import KanbanBoardFilters from "@/components/kanban/kanban-board-filters";
import KanbanColumn from "@/components/kanban/kanban-column";
import KanbanOnboardingTour from "@/components/kanban/kanban-onboarding-tour";
import KanbanOperationNoteDialog from "@/components/kanban/kanban-operation-note-dialog";
import KanbanStageTransitionDialog from "@/components/kanban/kanban-stage-transition-dialog";
import KanbanTaskCreateDialog from "@/components/kanban/kanban-task-create-dialog";
import KanbanTaskDetailsPanel from "@/components/kanban/kanban-task-details-panel";
import KanbanTaskEditDialog from "@/components/kanban/kanban-task-edit-dialog";
import KanbanTaskRenameDialog from "@/components/kanban/kanban-task-rename-dialog";
import { buttonVariants, Button } from "@/components/ui/button";
import { KANBAN_COLUMNS } from "@/constants/kanban-columns";
import { EMPTY_KANBAN_TASK_FILTERS } from "@/constants/kanban-filters";
import { KANBAN_ROLE_DEFINITIONS } from "@/constants/kanban-role-capabilities";
import {
  findStatusOfDraggable,
  findTaskById,
  getColumnTitle,
  moveTaskToStatus,
  reorderTaskWithinStatus,
} from "@/lib/kanban";
import { filterKanbanTasksByStatus } from "@/lib/kanban-filters";
import type { KanbanAttachment } from "@/types/attachment";
import type { KanbanTaskFilters } from "@/types/kanban-filters";
import type { KanbanDailyUpdate, KanbanStageTransition } from "@/types/kanban-stages";
import type {
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
    postDailyUpdate,
    addTaskUpdate,
    attachFiles,
    removeAttachment,
    getTaskPermissions,
    getMoveDeniedReason,
  } = useKanbanBoard();
  const dndContextId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: POINTER_ACTIVATION_DISTANCE_PX } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter is reserved for opening a card's details, so only Space starts a keyboard drag.
      keyboardCodes: KEYBOARD_DRAG_CODES,
    }),
  );

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [tasksBeforeDrag, setTasksBeforeDrag] = useState<KanbanTasksByStatus | null>(null);
  const [blockedMoveNotice, setBlockedMoveNotice] = useState<string | null>(null);
  const [taskFilters, setTaskFilters] = useState<KanbanTaskFilters>(EMPTY_KANBAN_TASK_FILTERS);
  const [openDialogKind, setOpenDialogKind] = useState<KanbanTaskDialogKind | null>(null);
  // Kept after a dialog closes so its content doesn't vanish during the exit animation.
  const [dialogTask, setDialogTask] = useState<KanbanTask | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  // Kept after the panel closes, so its content stays during the exit animation.
  const [detailsTaskId, setDetailsTaskId] = useState<string | null>(null);
  // Kept after the note dialog closes, for the same exit-animation reason as dialogTask.
  const [pendingNoteOperation, setPendingNoteOperation] =
    useState<KanbanPendingNoteOperation | null>(null);

  const activeTask = useMemo(
    () => (activeTaskId ? findTaskById(tasksByStatus, activeTaskId) : undefined),
    [activeTaskId, tasksByStatus],
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
        : KANBAN_COLUMNS,
    [taskFilters.statuses],
  );
  const totalTaskCount = useMemo(
    () => Object.values(tasksByStatus).reduce((taskCount, tasks) => taskCount + tasks.length, 0),
    [tasksByStatus],
  );
  const visibleTaskCount = useMemo(
    () =>
      visibleColumns.reduce(
        (taskCount, column) => taskCount + visibleTasksByStatus[column.status].length,
        0,
      ),
    [visibleColumns, visibleTasksByStatus],
  );

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

  function resetDragState() {
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

  async function handleSubmitCreateTask(formValues: KanbanTaskFormValues) {
    await createTask(formValues);
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

  async function handleConfirmNoteOperation(note: string) {
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
        await addTaskUpdate(pendingNoteOperation.task, note);
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

  async function handleConfirmStageTransition(transition: KanbanStageTransition) {
    if (pendingNoteOperation?.kind !== "move") {
      return;
    }

    await transitionTask(pendingNoteOperation.task.id, pendingNoteOperation.previousStatus, transition);
    closeNoteDialogAfterSave();
  }

  async function handleConfirmDailyUpdate(dailyUpdate: KanbanDailyUpdate) {
    if (pendingNoteOperation?.kind !== "daily-update") {
      return;
    }

    await postDailyUpdate(pendingNoteOperation.task, dailyUpdate);
    closeNoteDialogAfterSave();
  }

  function handleSelectTaskOwner(task: KanbanTask, newOwnerName: string) {
    if (task.ownerName !== newOwnerName) {
      openNoteDialog({ kind: "change-owner", task, newOwnerName });
    }
  }

  function openReviewDecision(task: KanbanTask, newStatus: KanbanStatus) {
    openNoteDialog({
      kind: "move",
      task,
      previousStatus: task.status,
      newStatus,
      tasksBeforeMove: null,
    });
  }

  function openDetailsPanel(task: KanbanTask) {
    setDetailsTaskId(task.id);
    setIsDetailsPanelOpen(true);
  }

  const kanbanTaskActions: KanbanTaskActions = {
    onOpenDetails: openDetailsPanel,
    onClickEdit: (task) => openTaskDialog("edit", task),
    onClickRename: (task) => openTaskDialog("rename", task),
    onClickArchive: (task) => openNoteDialog({ kind: "archive", task }),
    onSelectOwner: handleSelectTaskOwner,
    onClickDailyUpdate: (task) => openNoteDialog({ kind: "daily-update", task }),
    onClickAddUpdate: (task) => openNoteDialog({ kind: "add-update", task }),
    onClickApprove: (task) => openReviewDecision(task, "done"),
    onClickReturn: (task) => openReviewDecision(task, "working-on-it"),
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

  // E2-4: reviewers are anyone whose role can review, other than the card's owner.
  const reviewerOptions = teamMembers.filter(
    (teamMember) =>
      KANBAN_ROLE_DEFINITIONS[teamMember.role].capabilities.canReviewTasks &&
      teamMember.name !== pendingNoteOperation?.task.ownerName,
  );
  const stageOperation: KanbanStageOperation | null =
    pendingNoteOperation?.kind === "move" || pendingNoteOperation?.kind === "daily-update"
      ? pendingNoteOperation
      : null;
  const noteOnlyOperation: KanbanNoteOnlyOperation | null =
    pendingNoteOperation && !stageOperation ? (pendingNoteOperation as KanbanNoteOnlyOperation) : null;

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCorners}
      accessibility={{
        announcements: dragAnnouncements,
        screenReaderInstructions: SCREEN_READER_INSTRUCTIONS,
      }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex items-center gap-2 px-6 pb-4">
        <Button data-tour="new-task" onClick={() => openTaskDialog("create", null)}>
          <Plus aria-hidden />
          New task
        </Button>
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
        visibleTaskCount={visibleTaskCount}
        totalTaskCount={totalTaskCount}
      />

      <div data-tour="board-columns" className="flex min-h-0 flex-1 gap-4 overflow-x-auto px-6 pb-6">
        {visibleColumns.map((column) => (
          <KanbanColumn
            key={column.status}
            column={column}
            tasks={visibleTasksByStatus[column.status]}
            totalTaskCount={tasksByStatus[column.status].length}
            teamMembers={teamMembers}
            taskActions={kanbanTaskActions}
            dropBlockedReason={getDropBlockedReason(column.status)}
          />
        ))}
      </div>

      <DragOverlay>{activeTask ? <KanbanCardContent task={activeTask} isOverlay /> : null}</DragOverlay>

      <KanbanOnboardingTour />

      <KanbanTaskDetailsPanel
        task={detailsTask}
        teamMembers={teamMembers}
        taskActions={detailsPanelTaskActions}
        isOpen={isDetailsPanelOpen && detailsTask !== null}
        onOpenChange={setIsDetailsPanelOpen}
      />
      <KanbanTaskCreateDialog
        mentionables={mentionables}
        teamMembers={teamMembers}
        isOpen={openDialogKind === "create"}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleSubmitCreateTask}
      />
      <KanbanTaskEditDialog
        mentionables={mentionables}
        canChangeOwner={dialogTask ? getTaskPermissions(dialogTask).canChangeOwner : false}
        task={dialogTask}
        teamMembers={teamMembers}
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
        onConfirm={handleConfirmNoteOperation}
      />
      <KanbanStageTransitionDialog
        operation={stageOperation}
        reviewerOptions={reviewerOptions}
        mentionables={mentionables}
        isOpen={isNoteDialogOpen && stageOperation !== null}
        onOpenChange={handleNoteDialogOpenChange}
        onConfirmTransition={handleConfirmStageTransition}
        onConfirmDailyUpdate={handleConfirmDailyUpdate}
      />
    </DndContext>
  );
}
