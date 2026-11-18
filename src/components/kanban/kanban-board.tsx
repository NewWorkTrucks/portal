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
import KanbanColumn from "@/components/kanban/kanban-column";
import KanbanOperationNoteDialog from "@/components/kanban/kanban-operation-note-dialog";
import KanbanTaskCreateDialog from "@/components/kanban/kanban-task-create-dialog";
import KanbanTaskEditDialog from "@/components/kanban/kanban-task-edit-dialog";
import KanbanTaskRenameDialog from "@/components/kanban/kanban-task-rename-dialog";
import { buttonVariants, Button } from "@/components/ui/button";
import { KANBAN_COLUMNS } from "@/constants/kanban-columns";
import {
  findStatusOfDraggable,
  findTaskById,
  getColumnTitle,
  moveTaskToStatus,
  reorderTaskWithinStatus,
} from "@/lib/kanban";
import type {
  KanbanPendingNoteOperation,
  KanbanStatus,
  KanbanTask,
  KanbanTaskActions,
  KanbanTaskDialogKind,
  KanbanTaskFormValues,
  KanbanTasksByStatus,
} from "@/types/kanban";

const POINTER_ACTIVATION_DISTANCE_PX = 5;

export default function KanbanBoard() {
  const {
    teamMembers,
    mentionables,
    tasksByStatus,
    setTasksByStatus,
    createTask,
    updateTask,
    renameTask,
    changeTaskOwner,
    archiveTask,
    commitTaskMove,
    getTaskPermissions,
    getMoveDeniedReason,
  } = useKanbanBoard();
  const dndContextId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: POINTER_ACTIVATION_DISTANCE_PX } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [tasksBeforeDrag, setTasksBeforeDrag] = useState<KanbanTasksByStatus | null>(null);
  const [blockedMoveNotice, setBlockedMoveNotice] = useState<string | null>(null);
  const [openDialogKind, setOpenDialogKind] = useState<KanbanTaskDialogKind | null>(null);
  // Kept after a dialog closes so its content doesn't vanish during the exit animation.
  const [dialogTask, setDialogTask] = useState<KanbanTask | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  // Kept after the note dialog closes, for the same exit-animation reason as dialogTask.
  const [pendingNoteOperation, setPendingNoteOperation] =
    useState<KanbanPendingNoteOperation | null>(null);

  const activeTask = useMemo(
    () => (activeTaskId ? findTaskById(tasksByStatus, activeTaskId) : undefined),
    [activeTaskId, tasksByStatus],
  );

  // The dragged card as it was when picked up, so permissions use its original column.
  const draggedTaskAtStart = useMemo(
    () => (activeTaskId && tasksBeforeDrag ? findTaskById(tasksBeforeDrag, activeTaskId) : undefined),
    [activeTaskId, tasksBeforeDrag],
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
    setTasksBeforeDrag(tasksByStatus);
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

  function handleNoteDialogOpenChange(isOpen: boolean) {
    if (isOpen) {
      return;
    }

    if (pendingNoteOperation?.kind === "move") {
      setTasksByStatus(pendingNoteOperation.tasksBeforeMove);
    }
    setIsNoteDialogOpen(false);
  }

  async function handleConfirmNoteOperation(note: string) {
    if (!pendingNoteOperation) {
      return;
    }

    switch (pendingNoteOperation.kind) {
      case "move":
        await commitTaskMove(
          pendingNoteOperation.task.id,
          pendingNoteOperation.previousStatus,
          note,
        );
        break;
      case "change-owner":
        await changeTaskOwner(pendingNoteOperation.task, pendingNoteOperation.newOwnerName, note);
        break;
      case "archive":
        await archiveTask(pendingNoteOperation.task, note);
        break;
    }

    setIsNoteDialogOpen(false);
  }

  function handleSelectTaskOwner(task: KanbanTask, newOwnerName: string) {
    if (task.ownerName !== newOwnerName) {
      openNoteDialog({ kind: "change-owner", task, newOwnerName });
    }
  }

  const kanbanTaskActions: KanbanTaskActions = {
    onClickEdit: (task) => openTaskDialog("edit", task),
    onClickRename: (task) => openTaskDialog("rename", task),
    onClickArchive: (task) => openNoteDialog({ kind: "archive", task }),
    onSelectOwner: handleSelectTaskOwner,
  };

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCorners}
      accessibility={{ announcements: dragAnnouncements }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex items-center gap-2 px-6 pb-4">
        <Button onClick={() => openTaskDialog("create", null)}>
          <Plus aria-hidden />
          New task
        </Button>
        {/* TODO: Temporary route. Move the audit log to its own page in the portal navigation. */}
        <Link href="/kanban/audit-log" className={buttonVariants({ variant: "outline" })}>
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

      <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto px-6 pb-6">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            column={column}
            tasks={tasksByStatus[column.status]}
            teamMembers={teamMembers}
            taskActions={kanbanTaskActions}
            dropBlockedReason={getDropBlockedReason(column.status)}
          />
        ))}
      </div>

      <DragOverlay>{activeTask ? <KanbanCardContent task={activeTask} isOverlay /> : null}</DragOverlay>

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
        operation={pendingNoteOperation}
        isOpen={isNoteDialogOpen}
        onOpenChange={handleNoteDialogOpenChange}
        onConfirm={handleConfirmNoteOperation}
      />
    </DndContext>
  );
}
