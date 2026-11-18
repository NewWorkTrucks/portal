"use client";

import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import {
  archiveKanbanTask,
  changeKanbanTaskOwner,
  createKanbanTask,
  moveKanbanTask,
  notifyMentionedUsers,
  renameKanbanTask,
  updateKanbanTask,
} from "@/api/kanban";
import { useCurrentUser } from "@/components/current-user-provider";
import { MOCK_MENTION_AUTO_INCLUDE_RULES, MOCK_MENTION_GROUPS } from "@/data/mock-mention-groups";
import {
  findStatusOfDraggable,
  formatEstimatedTurnaround,
  getColumnTitle,
  groupTasksByStatus,
  removeTaskById,
  updateTaskById,
} from "@/lib/kanban";
import { createAuditLogEntry, describeTaskEdits } from "@/lib/kanban-audit-log";
import {
  assertKanbanPermission,
  getKanbanTaskPermissions,
  getTaskMoveDeniedReason,
} from "@/lib/kanban-permissions";
import { buildMentionables, resolveMentionedNames } from "@/lib/mentions";
import type { KanbanAuditLogAction, KanbanAuditLogEntry } from "@/types/audit-log";
import type {
  ArchivedKanbanTask,
  KanbanBoardContextValue,
  KanbanStatus,
  KanbanTask,
  KanbanTaskEditableFields,
  KanbanTaskFormValues,
  KanbanTasksByStatus,
} from "@/types/kanban";

const KanbanBoardContext = createContext<KanbanBoardContextValue | null>(null);

type KanbanBoardProviderProps = {
  initialTasks: KanbanTask[];
  children: ReactNode;
};

/**
 * Owns the board's data for every /kanban route, so the board and the audit log share it.
 * Every committed change goes through an action here, which calls the API and appends
 * an audit log entry. Nothing removes or edits log entries.
 */
export function KanbanBoardProvider({ initialTasks, children }: KanbanBoardProviderProps) {
  const { teamMembers, currentUser, signedInUser, isSimulatingUser } = useCurrentUser();

  const [tasksByStatus, setTasksByStatus] = useState<KanbanTasksByStatus>(() =>
    groupTasksByStatus(initialTasks),
  );
  const [archivedTasks, setArchivedTasks] = useState<ArchivedKanbanTask[]>([]);
  // TODO: Load from and persist to the backend activity log (append-only) instead of memory.
  const [auditLogEntries, setAuditLogEntries] = useState<readonly KanbanAuditLogEntry[]>([]);

  const mentionables = useMemo(
    () => buildMentionables(teamMembers, MOCK_MENTION_GROUPS),
    [teamMembers],
  );

  /** Appends an audit log entry with the note's resolved mentions, then notifies them. */
  async function recordAuditLogEntry(
    task: Pick<KanbanTask, "id" | "title">,
    action: KanbanAuditLogAction,
    summary: string,
    note: string,
  ) {
    const mentionedNames = resolveMentionedNames(
      note,
      mentionables,
      MOCK_MENTION_AUTO_INCLUDE_RULES,
    );

    setAuditLogEntries((previousEntries) => [
      createAuditLogEntry(
        task,
        action,
        {
          actorName: currentUser.name,
          simulatedByName: isSimulatingUser ? signedInUser.name : undefined,
        },
        summary,
        note,
        mentionedNames,
      ),
      ...previousEntries,
    ]);

    if (mentionedNames.length > 0) {
      await notifyMentionedUsers(task.id, mentionedNames, note);
    }
  }

  async function createTask(formValues: KanbanTaskFormValues) {
    const { note, ...taskFields } = formValues;
    const newTask: KanbanTask = {
      ...taskFields,
      id: `task-${crypto.randomUUID()}`,
      latestNote: note,
    };

    await createKanbanTask(formValues);
    setTasksByStatus((previousTasksByStatus) => ({
      ...previousTasksByStatus,
      [newTask.status]: [newTask, ...previousTasksByStatus[newTask.status]],
    }));
    await recordAuditLogEntry(newTask, "created", `Created in ${getColumnTitle(newTask.status)} for ${newTask.ownerName}, est. ${formatEstimatedTurnaround(newTask.estimatedTurnaround)}`, note);
  }

  function getTaskPermissions(task: KanbanTask) {
    return getKanbanTaskPermissions(currentUser, task);
  }

  function getMoveDeniedReason(task: KanbanTask, newStatus: KanbanStatus) {
    return getTaskMoveDeniedReason(currentUser, task, newStatus);
  }

  async function updateTask(task: KanbanTask, formValues: KanbanTaskFormValues) {
    const taskPermissions = getTaskPermissions(task);
    assertKanbanPermission(taskPermissions.canEdit, "You don't have permission to edit this card.");
    assertKanbanPermission(
      formValues.ownerName === task.ownerName || taskPermissions.canChangeOwner,
      "You don't have permission to reassign this card.",
    );

    // Status is never changed by an edit: it changes by moving the card, where stage gates apply.
    const editedFields: KanbanTaskEditableFields = {
      title: formValues.title,
      description: formValues.description,
      ownerName: formValues.ownerName,
      priority: formValues.priority,
      dueDate: formValues.dueDate,
      estimatedTurnaround: formValues.estimatedTurnaround,
    };
    const editSummary = describeTaskEdits(task, editedFields);

    await updateKanbanTask(task.id, formValues);
    setTasksByStatus((previousTasksByStatus) =>
      updateTaskById(previousTasksByStatus, task.id, {
        ...editedFields,
        latestNote: formValues.note,
      }),
    );
    await recordAuditLogEntry({ ...task, ...editedFields }, "edited", editSummary, formValues.note);
  }

  async function renameTask(task: KanbanTask, title: string, note: string) {
    assertKanbanPermission(
      getTaskPermissions(task).canRename,
      "You don't have permission to rename this card.",
    );
    await renameKanbanTask(task.id, title, note);
    setTasksByStatus((previousTasksByStatus) =>
      updateTaskById(previousTasksByStatus, task.id, { title, latestNote: note }),
    );
    await recordAuditLogEntry({ id: task.id, title }, "renamed", `Renamed from “${task.title}”`, note);
  }

  async function changeTaskOwner(task: KanbanTask, ownerName: string, note: string) {
    if (task.ownerName === ownerName) {
      return;
    }

    assertKanbanPermission(
      getTaskPermissions(task).canChangeOwner,
      "You don't have permission to reassign this card.",
    );
    await changeKanbanTaskOwner(task.id, ownerName, note);
    setTasksByStatus((previousTasksByStatus) =>
      updateTaskById(previousTasksByStatus, task.id, { ownerName, latestNote: note }),
    );
    await recordAuditLogEntry(task, "owner-changed", `Owner: ${task.ownerName} → ${ownerName}`, note);
  }

  async function archiveTask(task: KanbanTask, note: string) {
    assertKanbanPermission(
      getTaskPermissions(task).canArchive,
      "You don't have permission to archive cards.",
    );
    await archiveKanbanTask(task.id, note);
    setTasksByStatus((previousTasksByStatus) => removeTaskById(previousTasksByStatus, task.id));
    setArchivedTasks((previousArchivedTasks) => [
      { ...task, latestNote: note, archivedAt: new Date().toISOString() },
      ...previousArchivedTasks,
    ]);
    await recordAuditLogEntry(task, "archived", `Archived from ${getColumnTitle(task.status)}`, note);
  }

  /**
   * Records a finished drag once its required note is given. The card is already in its new
   * column. Reorders within a column aren't status changes, so they never reach here.
   */
  async function commitTaskMove(taskId: string, previousStatus: KanbanStatus, note: string) {
    const newStatus = findStatusOfDraggable(tasksByStatus, taskId);
    const movedTask = newStatus
      ? tasksByStatus[newStatus].find((task) => task.id === taskId)
      : undefined;

    if (!newStatus || !movedTask || newStatus === previousStatus) {
      return;
    }

    const moveDeniedReason = getMoveDeniedReason({ ...movedTask, status: previousStatus }, newStatus);
    assertKanbanPermission(moveDeniedReason === null, moveDeniedReason ?? "");

    await moveKanbanTask(taskId, newStatus, note);
    setTasksByStatus((previousTasksByStatus) =>
      updateTaskById(previousTasksByStatus, taskId, { latestNote: note }),
    );
    await recordAuditLogEntry(movedTask, "moved", `${getColumnTitle(previousStatus)} → ${getColumnTitle(newStatus)}`, note);
  }

  return (
    <KanbanBoardContext.Provider
      value={{
        teamMembers,
        mentionables,
        tasksByStatus,
        archivedTasks,
        auditLogEntries,
        setTasksByStatus,
        createTask,
        updateTask,
        renameTask,
        changeTaskOwner,
        archiveTask,
        commitTaskMove,
        getTaskPermissions,
        getMoveDeniedReason,
      }}
    >
      {children}
    </KanbanBoardContext.Provider>
  );
}

export function useKanbanBoard(): KanbanBoardContextValue {
  const kanbanBoardContext = useContext(KanbanBoardContext);

  if (!kanbanBoardContext) {
    throw new Error("useKanbanBoard must be used inside <KanbanBoardProvider>.");
  }

  return kanbanBoardContext;
}
