"use client";

import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import {
  archiveKanbanTask,
  changeKanbanTaskOwner,
  createKanbanTask,
  notifyMentionedUsers,
  postKanbanDailyUpdate,
  postKanbanTaskUpdate,
  removeKanbanAttachment,
  renameKanbanTask,
  transitionKanbanTask,
  updateKanbanTask,
  uploadKanbanAttachments,
} from "@/api/kanban";
import { useCurrentUser } from "@/components/current-user-provider";
import { MAX_ATTACHMENT_SIZE_BYTES } from "@/constants/attachments";
import { KANBAN_CREATABLE_STATUSES } from "@/constants/kanban-stages";
import { MOCK_MENTION_AUTO_INCLUDE_RULES, MOCK_MENTION_GROUPS } from "@/data/mock-mention-groups";
import {
  findStatusOfDraggable,
  findTaskById,
  formatEstimatedTurnaround,
  getColumnTitle,
  groupTasksByStatus,
  moveTaskToStatus,
  removeTaskById,
  updateTaskById,
} from "@/lib/kanban";
import { createAuditLogEntry, describeTaskEdits } from "@/lib/kanban-audit-log";
import {
  assertKanbanPermission,
  getKanbanTaskPermissions,
  getTaskMoveDeniedReason,
} from "@/lib/kanban-permissions";
import {
  describeDailyUpdate,
  formatFileSize,
  getStageAutoMentionHandles,
  getStageTaskChanges,
} from "@/lib/kanban-stages";
import { buildMentionables, resolveMentionedNames } from "@/lib/mentions";
import type { KanbanAttachment } from "@/types/attachment";
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
import type { KanbanDailyUpdate, KanbanStageTransition } from "@/types/kanban-stages";

/** Logged for a card created without a note; matches the database's kanban_create_task. */
const CREATED_WITHOUT_NOTE = "Card created.";

/** Filled by the mock provider below or by LiveKanbanBoardProvider, depending on data mode. */
export const KanbanBoardContext = createContext<KanbanBoardContextValue | null>(null);

type KanbanBoardProviderProps = {
  initialTasks: KanbanTask[];
  children: ReactNode;
};

/**
 * Owns the board's data for every /kanban route, so the board and the audit log share it.
 * Every committed change goes through an action here, which calls the API and appends
 * an audit log entry. Nothing removes or edits log entries.
 */
/** Mock mode: sample cards kept in this browser; the src/api stubs stand in for the backend. */
export function KanbanBoardProvider({ initialTasks, children }: KanbanBoardProviderProps) {
  const {
    teamMembers: allTeamMembers,
    currentUser,
    signedInUser,
    isSimulatingUser,
    currentBusiness,
  } = useCurrentUser();

  const [tasksByStatus, setTasksByStatus] = useState<KanbanTasksByStatus>(() =>
    groupTasksByStatus(initialTasks),
  );
  const [archivedTasks, setArchivedTasks] = useState<ArchivedKanbanTask[]>([]);
  // TODO: Load from and persist to the backend activity log (append-only) instead of memory.
  const [auditLogEntries, setAuditLogEntries] = useState<readonly KanbanAuditLogEntry[]>([]);

  // E4-2: everything below is scoped to the current business. Other businesses' cards stay in
  // state (like rows in a shared table) but are never shown or changed from here.
  // TODO: The backend must enforce this with business_id and RLS; this is a client-side mock.
  const teamMembers = useMemo(
    () => allTeamMembers.filter((teamMember) => teamMember.businessIds.includes(currentBusiness.id)),
    [allTeamMembers, currentBusiness.id],
  );
  const businessTasksByStatus = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(tasksByStatus).map(([status, tasks]) => [
          status,
          tasks.filter((task) => task.businessId === currentBusiness.id),
        ]),
      ) as KanbanTasksByStatus,
    [tasksByStatus, currentBusiness.id],
  );
  const businessArchivedTasks = useMemo(
    () => archivedTasks.filter((task) => task.businessId === currentBusiness.id),
    [archivedTasks, currentBusiness.id],
  );
  const businessAuditLogEntries = useMemo(
    () => auditLogEntries.filter((entry) => entry.businessId === currentBusiness.id),
    [auditLogEntries, currentBusiness.id],
  );

  const mentionables = useMemo(
    () => buildMentionables(teamMembers, MOCK_MENTION_GROUPS),
    [teamMembers],
  );

  /**
   * Appends an audit log entry with the note's resolved mentions, then notifies them.
   * `autoMentionHandles` are mentioned by policy, e.g. Leadership for Stuck cards (E2-7).
   */
  async function recordAuditLogEntry(
    task: Pick<KanbanTask, "id" | "title" | "businessId">,
    action: KanbanAuditLogAction,
    summary: string,
    note: string,
    autoMentionHandles: string[] = [],
  ) {
    const mentionedNames = resolveMentionedNames(
      [note, ...autoMentionHandles.map((handle) => `@${handle}`)].join(" "),
      mentionables,
      MOCK_MENTION_AUTO_INCLUDE_RULES,
    );

    const auditLogEntry = createAuditLogEntry(
      task,
      action,
      {
        actorName: currentUser.name,
        simulatedByName: isSimulatingUser ? signedInUser.name : undefined,
      },
      summary,
      note,
      mentionedNames,
    );
    setAuditLogEntries((previousEntries) => [auditLogEntry, ...previousEntries]);

    if (mentionedNames.length > 0) {
      await notifyMentionedUsers(task.id, mentionedNames, note);
    }
    return auditLogEntry.id;
  }

  async function createTask(formValues: KanbanTaskFormValues) {
    // Other stages have required fields, so new cards start in a stage without any (Epic 2).
    assertKanbanPermission(
      KANBAN_CREATABLE_STATUSES.includes(formValues.status),
      `New cards start in ${KANBAN_CREATABLE_STATUSES.map(getColumnTitle).join(" or ")}.`,
    );

    const { note, ...taskFields } = formValues;
    const newTask: KanbanTask = {
      ...taskFields,
      id: `task-${crypto.randomUUID()}`,
      businessId: currentBusiness.id,
      latestNote: note,
      attachments: [],
      deferralCount: 0,
    };

    await createKanbanTask(formValues);
    setTasksByStatus((previousTasksByStatus) => ({
      ...previousTasksByStatus,
      [newTask.status]: [newTask, ...previousTasksByStatus[newTask.status]],
    }));
    const turnaroundSummary = newTask.estimatedTurnaround
      ? `, est. ${formatEstimatedTurnaround(newTask.estimatedTurnaround)}`
      : "";
    await recordAuditLogEntry(
      newTask,
      "created",
      `Created in ${getColumnTitle(newTask.status)} for ${newTask.ownerName}${turnaroundSummary}`,
      note || CREATED_WITHOUT_NOTE,
    );
  }

  function assertTaskInCurrentBusiness(task: Pick<KanbanTask, "businessId">) {
    assertKanbanPermission(
      task.businessId === currentBusiness.id,
      `This card belongs to another business and can't be changed from ${currentBusiness.shortName}.`,
    );
  }

  function getTaskPermissions(task: KanbanTask) {
    return getKanbanTaskPermissions(currentUser, task);
  }

  function getMoveDeniedReason(task: KanbanTask, newStatus: KanbanStatus) {
    return getTaskMoveDeniedReason(currentUser, task, newStatus);
  }

  async function updateTask(task: KanbanTask, formValues: KanbanTaskFormValues) {
    assertTaskInCurrentBusiness(task);
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
    assertTaskInCurrentBusiness(task);
    assertKanbanPermission(
      getTaskPermissions(task).canRename,
      "You don't have permission to rename this card.",
    );
    await renameKanbanTask(task.id, title, note);
    setTasksByStatus((previousTasksByStatus) =>
      updateTaskById(previousTasksByStatus, task.id, { title, latestNote: note }),
    );
    await recordAuditLogEntry({ id: task.id, title, businessId: task.businessId }, "renamed", `Renamed from “${task.title}”`, note);
  }

  async function changeTaskOwner(task: KanbanTask, ownerName: string, note: string) {
    assertTaskInCurrentBusiness(task);
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
    assertTaskInCurrentBusiness(task);
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

  /** Adds files posted with an update to the card, linked to that update's activity entry. */
  async function addUpdateFiles(task: KanbanTask, files: File[], activityId: string, note: string) {
    if (files.length === 0) {
      return;
    }
    assertKanbanPermission(
      getTaskPermissions(task).canManageAttachments,
      "You don't have permission to add attachments to this card.",
    );
    const uploadedAttachments = (await uploadKanbanAttachments(task.id, files, currentUser.name, note)).map(
      (attachment) => ({ ...attachment, activityId }),
    );
    setTasksByStatus((previousTasksByStatus) => {
      const latestTask = findTaskById(previousTasksByStatus, task.id);
      return updateTaskById(previousTasksByStatus, task.id, {
        attachments: [...uploadedAttachments, ...(latestTask?.attachments ?? [])],
      });
    });
  }

  async function transitionTask(
    taskId: string,
    previousStatus: KanbanStatus,
    transition: KanbanStageTransition,
    files: File[] = [],
  ) {
    const currentStatus = findStatusOfDraggable(tasksByStatus, taskId);
    const task = currentStatus
      ? tasksByStatus[currentStatus].find((boardTask) => boardTask.id === taskId)
      : undefined;
    const newStatus = transition.status;

    if (!task || newStatus === previousStatus) {
      return;
    }

    assertTaskInCurrentBusiness(task);

    const moveDeniedReason = getMoveDeniedReason({ ...task, status: previousStatus }, newStatus);
    assertKanbanPermission(moveDeniedReason === null, moveDeniedReason ?? "");

    const stageTaskChanges = getStageTaskChanges(task, transition);

    await transitionKanbanTask(taskId, transition);
    setTasksByStatus((previousTasksByStatus) => {
      // Drags already previewed the card in its new column; buttons (approve, return) move it here.
      const tasksInNewColumn =
        currentStatus === newStatus
          ? previousTasksByStatus
          : moveTaskToStatus(previousTasksByStatus, taskId, newStatus, 0);

      return updateTaskById(tasksInNewColumn, taskId, stageTaskChanges);
    });
    const activityId = await recordAuditLogEntry(
      task,
      "moved",
      `${getColumnTitle(previousStatus)} → ${getColumnTitle(newStatus)}`,
      stageTaskChanges.latestNote ?? "",
      getStageAutoMentionHandles(transition, previousStatus),
    );
    await addUpdateFiles(task, files, activityId, stageTaskChanges.latestNote ?? "");
  }

  async function postDailyUpdate(task: KanbanTask, dailyUpdate: KanbanDailyUpdate, files: File[] = []) {
    assertTaskInCurrentBusiness(task);
    assertKanbanPermission(
      getTaskPermissions(task).canPostDailyUpdate,
      "Only the owner, a coordinator or an admin can post updates on cards in Working on It.",
    );

    const dailyUpdateNote = describeDailyUpdate(dailyUpdate);

    await postKanbanDailyUpdate(task.id, dailyUpdate);
    setTasksByStatus((previousTasksByStatus) =>
      updateTaskById(previousTasksByStatus, task.id, {
        latestNote: dailyUpdateNote,
        lastDailyUpdateAt: new Date().toISOString(),
      }),
    );
    const activityId = await recordAuditLogEntry(task, "daily-update", "Daily update", dailyUpdateNote);
    await addUpdateFiles(task, files, activityId, dailyUpdateNote);
  }

  async function addTaskUpdate(task: KanbanTask, note: string, files: File[] = []) {
    assertTaskInCurrentBusiness(task);
    assertKanbanPermission(
      getTaskPermissions(task).canAddUpdate,
      "You don't have permission to post updates on this card.",
    );

    await postKanbanTaskUpdate(task.id, note);
    setTasksByStatus((previousTasksByStatus) =>
      updateTaskById(previousTasksByStatus, task.id, { latestNote: note }),
    );
    const activityId = await recordAuditLogEntry(task, "update", `Posted in ${getColumnTitle(task.status)}`, note);
    await addUpdateFiles(task, files, activityId, note);
  }

  async function attachFiles(task: KanbanTask, files: File[], note: string) {
    assertTaskInCurrentBusiness(task);
    assertKanbanPermission(
      getTaskPermissions(task).canManageAttachments,
      "You don't have permission to add attachments to this card.",
    );
    assertKanbanPermission(
      files.every((file) => file.size <= MAX_ATTACHMENT_SIZE_BYTES),
      `Each file must be ${formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)} or smaller.`,
    );

    const uploadedAttachments = await uploadKanbanAttachments(task.id, files, currentUser.name, note);
    setTasksByStatus((previousTasksByStatus) => {
      const status = findStatusOfDraggable(previousTasksByStatus, task.id);
      const latestTask = status
        ? previousTasksByStatus[status].find((boardTask) => boardTask.id === task.id)
        : undefined;

      return updateTaskById(previousTasksByStatus, task.id, {
        attachments: [...uploadedAttachments, ...(latestTask?.attachments ?? [])],
        latestNote: note,
      });
    });
    await recordAuditLogEntry(
      task,
      "attached",
      `Attached ${uploadedAttachments.map((attachment) => attachment.fileName).join(", ")}`,
      note,
    );
  }

  async function removeAttachment(task: KanbanTask, attachment: KanbanAttachment, note: string) {
    assertTaskInCurrentBusiness(task);
    assertKanbanPermission(
      getTaskPermissions(task).canManageAttachments,
      "You don't have permission to remove attachments from this card.",
    );

    await removeKanbanAttachment(task.id, attachment.id, note);
    setTasksByStatus((previousTasksByStatus) => {
      const status = findStatusOfDraggable(previousTasksByStatus, task.id);
      const latestTask = status
        ? previousTasksByStatus[status].find((boardTask) => boardTask.id === task.id)
        : undefined;

      return updateTaskById(previousTasksByStatus, task.id, {
        attachments: (latestTask?.attachments ?? []).filter(
          (taskAttachment) => taskAttachment.id !== attachment.id,
        ),
        latestNote: note,
      });
    });
    URL.revokeObjectURL(attachment.url);
    await recordAuditLogEntry(task, "attachment-removed", `Removed ${attachment.fileName}`, note);
  }

  return (
    <KanbanBoardContext.Provider
      value={{
        teamMembers,
        mentionables,
        tasksByStatus: businessTasksByStatus,
        allTasksByStatus: tasksByStatus,
        archivedTasks: businessArchivedTasks,
        auditLogEntries: businessAuditLogEntries,
        setTasksByStatus,
        createTask,
        updateTask,
        renameTask,
        changeTaskOwner,
        archiveTask,
        transitionTask,
        // Mock order lives only in this browser, so there is nothing to save.
        reorderTask: async () => undefined,
        postDailyUpdate,
        addTaskUpdate,
        attachFiles,
        removeAttachment,
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
