"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import { KanbanBoardContext } from "@/components/kanban/kanban-board-provider";
import { MAX_ATTACHMENT_SIZE_BYTES } from "@/constants/attachments";
import { useBoardBusinesses } from "@/hooks/use-board-businesses";
import { findStatusOfDraggable, findTaskById, groupTasksByStatus } from "@/lib/kanban";
import {
  getAssignableTeamMembers,
  getKanbanTaskPermissions,
  getTaskMoveDeniedReason,
} from "@/lib/kanban-permissions";
import { describeDailyUpdate, describeStageTransition, formatFileSize } from "@/lib/kanban-stages";
import {
  getPositionBetweenNeighbors,
  toKanbanAttachment,
  toKanbanAuditLogEntry,
  toKanbanTask,
  toTransitionDetails,
} from "@/lib/live/kanban-rows";
import { buildMentionables, resolveMentionedNames } from "@/lib/mentions";
import { showErrorToast, showRequestErrorToast } from "@/lib/toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { KanbanAttachment } from "@/types/attachment";
import type { KanbanAuditLogEntry } from "@/types/audit-log";
import type {
  ArchivedKanbanTask,
  KanbanStatus,
  KanbanTask,
  KanbanTaskFormValues,
  KanbanTasksByStatus,
} from "@/types/kanban";
import type { KanbanDailyUpdate, KanbanStageTransition } from "@/types/kanban-stages";
import type {
  KanbanActivityRow,
  KanbanAttachmentRow,
  KanbanTaskRow,
  MentionGroupMemberRow,
  MentionGroupRow,
} from "@/types/live/rows";
import type { MentionGroup } from "@/types/mention";

const ATTACHMENT_BUCKET = "kanban-attachments";
const ATTACHMENT_URL_LIFETIME_SECONDS = 60 * 60;
/** Per business on the board, so "All businesses" keeps the same history depth. */
const ACTIVITY_LOAD_LIMIT = 500;
// Coalesces bursts of realtime events (one save touches the card and the activity log).
const REALTIME_RELOAD_DELAY_MS = 300;

type LiveKanbanBoardProviderProps = {
  children: ReactNode;
};

function toSafeFileName(fileName: string): string {
  return fileName.replace(/[^A-Za-z0-9._-]+/g, "-").slice(-120) || "file";
}

/**
 * Live mode: the current business's board from Supabase (E1-3, E1-4, E1-5). Every change goes
 * through a kanban_* database function, which checks permissions and logs it; the board then
 * reloads. Other people's changes arrive through realtime within seconds.
 */
export default function LiveKanbanBoardProvider({ children }: LiveKanbanBoardProviderProps) {
  const { teamMembers, currentUser, currentBusiness } = useCurrentUser();
  const boardBusinesses = useBoardBusinesses();
  const supabase = getSupabaseBrowserClient();

  const [tasksByStatus, setTasksByStatus] = useState<KanbanTasksByStatus>(() => groupTasksByStatus([]));
  const [archivedTasks, setArchivedTasks] = useState<ArchivedKanbanTask[]>([]);
  const [auditLogEntries, setAuditLogEntries] = useState<readonly KanbanAuditLogEntry[]>([]);
  const [mentionGroups, setMentionGroups] = useState<MentionGroup[]>([]);
  const reloadTimeoutRef = useRef<number | null>(null);

  const nameByUserId = useMemo(
    () => new Map(teamMembers.map((teamMember) => [teamMember.id, teamMember.name])),
    [teamMembers],
  );
  const userIdByName = useMemo(
    () => new Map(teamMembers.map((teamMember) => [teamMember.name, teamMember.id])),
    [teamMembers],
  );
  const assignableTeamMembers = useMemo(
    () => getAssignableTeamMembers(currentUser, teamMembers, teamMembers),
    [currentUser, teamMembers],
  );
  const mentionables = useMemo(
    () => buildMentionables(teamMembers, mentionGroups),
    [teamMembers, mentionGroups],
  );

  // A string, so the loader and realtime only restart when the set of businesses really changes.
  const boardBusinessIdsKey = boardBusinesses.map((boardBusiness) => boardBusiness.id).join(",");

  const loadBoard = useCallback(async () => {
    if (!supabase) {
      return;
    }

    const businessId = currentBusiness.id;
    const boardBusinessIds = boardBusinessIdsKey.split(",");
    const [tasksResult, activityResult, attachmentsResult, groupsResult, groupMembersResult] =
      await Promise.all([
        supabase.from("kanban_tasks").select("*").in("business_id", boardBusinessIds).order("position"),
        supabase
          .from("kanban_activity")
          .select("*")
          .in("business_id", boardBusinessIds)
          .order("occurred_at", { ascending: false })
          .limit(ACTIVITY_LOAD_LIMIT * boardBusinessIds.length),
        supabase
          .from("kanban_attachments")
          .select("*")
          .in("business_id", boardBusinessIds)
          .is("removed_at", null)
          .order("uploaded_at", { ascending: false }),
        supabase.from("mention_groups").select("id, handle, label").eq("business_id", businessId),
        supabase.from("mention_group_members").select("mention_group_id, user_id"),
      ]);
    const loadError =
      tasksResult.error ?? activityResult.error ?? attachmentsResult.error ?? groupsResult.error ?? groupMembersResult.error;
    if (loadError) {
      showRequestErrorToast(loadError, "load the board");
      return;
    }

    const taskRows = tasksResult.data as KanbanTaskRow[];
    const attachmentRows = attachmentsResult.data as KanbanAttachmentRow[];
    const { data: signedUrls } = attachmentRows.length
      ? await supabase.storage
          .from(ATTACHMENT_BUCKET)
          .createSignedUrls(attachmentRows.map((attachmentRow) => attachmentRow.storage_path), ATTACHMENT_URL_LIFETIME_SECONDS)
      : { data: [] };
    const signedUrlByPath = new Map(
      (signedUrls ?? []).map((signedUrl) => [signedUrl.path ?? "", signedUrl.signedUrl]),
    );

    const attachmentsByTaskId = new Map<string, KanbanAttachment[]>();
    for (const attachmentRow of attachmentRows) {
      const taskAttachments = attachmentsByTaskId.get(attachmentRow.task_id) ?? [];
      taskAttachments.push(
        toKanbanAttachment(attachmentRow, nameByUserId, signedUrlByPath.get(attachmentRow.storage_path) ?? "#"),
      );
      attachmentsByTaskId.set(attachmentRow.task_id, taskAttachments);
    }

    const tasks = taskRows.map((taskRow) =>
      toKanbanTask(taskRow, nameByUserId, attachmentsByTaskId.get(taskRow.id) ?? []),
    );
    const titleByTaskId = new Map(tasks.map((task) => [task.id, task.title]));
    const groupMemberRows = groupMembersResult.data as MentionGroupMemberRow[];

    setTasksByStatus(
      groupTasksByStatus(tasks.filter((_task, taskIndex) => taskRows[taskIndex].archived_at === null)),
    );
    setArchivedTasks(
      taskRows
        .map((taskRow, taskIndex) => ({ taskRow, task: tasks[taskIndex] }))
        .filter(({ taskRow }) => taskRow.archived_at !== null)
        .map(({ taskRow, task }) => ({ ...task, archivedAt: taskRow.archived_at as string })),
    );
    setAuditLogEntries(
      (activityResult.data as KanbanActivityRow[]).map((activityRow) =>
        toKanbanAuditLogEntry(activityRow, nameByUserId, titleByTaskId),
      ),
    );
    setMentionGroups(
      (groupsResult.data as MentionGroupRow[]).map((groupRow) => ({
        handle: groupRow.handle,
        label: groupRow.label,
        memberNames: groupMemberRows
          .filter((groupMember) => groupMember.mention_group_id === groupRow.id)
          .map((groupMember) => nameByUserId.get(groupMember.user_id))
          .filter((name): name is string => Boolean(name)),
      })),
    );
  }, [supabase, currentBusiness.id, boardBusinessIdsKey, nameByUserId]);

  function showOversizedFileToast(fileName: string) {
    showErrorToast(`${fileName} is too large`, {
      description: `Files can be up to ${formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)}. Pick a smaller file, then try again.`,
    });
  }

  /** Runs a kanban_* function, then reloads. Errors are shown and the board is reloaded. */
  async function callKanbanFunction(functionName: string, params: Record<string, unknown>) {
    if (!supabase) {
      return;
    }
    const { error } = await supabase.rpc(functionName, params);
    if (error) {
      showRequestErrorToast(error, "save your change", "The board has been reloaded.");
    }
    await loadBoard();
  }

  /**
   * Uploads files to the card's Storage folder for an update, a daily update or a move, and
   * returns what the database function needs to record them. Null when an upload failed, so
   * the update isn't posted without its files.
   */
  async function uploadUpdateFiles(task: Pick<KanbanTask, "id" | "businessId">, files: File[]) {
    if (!supabase || files.length === 0) {
      return [];
    }
    const oversizedFile = files.find((file) => file.size > MAX_ATTACHMENT_SIZE_BYTES);
    if (oversizedFile) {
      showOversizedFileToast(oversizedFile.name);
      return null;
    }

    const uploadedFiles: { fileName: string; sizeBytes: number; mimeType: string; storagePath: string }[] = [];
    for (const file of files) {
      const storagePath = `${task.businessId}/${task.id}/${crypto.randomUUID()}-${toSafeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .upload(storagePath, file, { contentType: file.type || undefined });
      if (uploadError) {
        showRequestErrorToast(uploadError, `upload ${file.name}`, "The update wasn't posted.");
        return null;
      }
      uploadedFiles.push({ fileName: file.name, sizeBytes: file.size, mimeType: file.type, storagePath });
    }
    return uploadedFiles;
  }

  function getMentionedUserIds(note: string): string[] {
    // The database adds groups named by policy and the auto-include rules (E3-2) itself.
    return resolveMentionedNames(note, mentionables, [])
      .map((name) => userIdByName.get(name))
      .filter((userId): userId is string => Boolean(userId));
  }

  function requireUserId(name: string): string {
    const userId = userIdByName.get(name);
    if (!userId) {
      throw new Error(`${name} isn't a member of ${currentBusiness.shortName}.`);
    }
    return userId;
  }

  async function createTask(formValues: KanbanTaskFormValues, parentTaskId?: string) {
    await callKanbanFunction("kanban_create_task", {
      p_business_id: currentBusiness.id,
      p_title: formValues.title,
      p_description: formValues.description,
      p_status: formValues.status,
      p_owner_id: requireUserId(formValues.ownerName),
      p_priority: formValues.priority,
      p_due_date: formValues.dueDate,
      p_turnaround_amount: formValues.estimatedTurnaround?.amount ?? null,
      p_turnaround_unit: formValues.estimatedTurnaround?.unit ?? null,
      p_note: formValues.note,
      p_mentioned_user_ids: getMentionedUserIds(formValues.note),
      p_parent_task_id: parentTaskId ?? null,
    });
  }

  async function updateTask(task: KanbanTask, formValues: KanbanTaskFormValues) {
    await callKanbanFunction("kanban_update_task", {
      p_task_id: task.id,
      p_title: formValues.title,
      p_description: formValues.description,
      p_owner_id: requireUserId(formValues.ownerName),
      p_priority: formValues.priority,
      p_due_date: formValues.dueDate,
      p_turnaround_amount: formValues.estimatedTurnaround?.amount ?? null,
      p_turnaround_unit: formValues.estimatedTurnaround?.unit ?? null,
      p_note: formValues.note,
      p_mentioned_user_ids: getMentionedUserIds(formValues.note),
    });
  }

  async function renameTask(task: KanbanTask, title: string, note: string) {
    await callKanbanFunction("kanban_rename_task", {
      p_task_id: task.id,
      p_title: title,
      p_note: note,
      p_mentioned_user_ids: getMentionedUserIds(note),
    });
  }

  async function changeTaskOwner(task: KanbanTask, ownerName: string, note: string) {
    await callKanbanFunction("kanban_change_task_owner", {
      p_task_id: task.id,
      p_owner_id: requireUserId(ownerName),
      p_note: note,
      p_mentioned_user_ids: getMentionedUserIds(note),
    });
  }

  async function archiveTask(task: KanbanTask, note: string) {
    await callKanbanFunction("kanban_archive_task", {
      p_task_id: task.id,
      p_note: note,
      p_mentioned_user_ids: getMentionedUserIds(note),
    });
  }

  async function transitionTask(
    taskId: string,
    _previousStatus: KanbanStatus,
    transition: KanbanStageTransition,
    files: File[] = [],
  ) {
    const note = describeStageTransition(transition);
    const task = findTaskById(tasksByStatus, taskId);
    const uploadedFiles = task ? await uploadUpdateFiles(task, files) : [];
    if (uploadedFiles === null) {
      await loadBoard();
      return;
    }
    // A drag already placed the card in its new column; save that spot. Buttons (approve,
    // return) leave the card where it was, and the database puts it at the top.
    const statusOnBoard = findStatusOfDraggable(tasksByStatus, taskId);
    const position =
      statusOnBoard === transition.status
        ? getPositionBetweenNeighbors(tasksByStatus[transition.status], taskId)
        : null;

    await callKanbanFunction("kanban_transition_task", {
      p_task_id: taskId,
      p_new_status: transition.status,
      p_details: toTransitionDetails(transition, userIdByName),
      p_note: note,
      p_mentioned_user_ids: getMentionedUserIds(note),
      p_position: position,
      p_attachments: uploadedFiles,
    });
  }

  async function reorderTask(taskId: string, orderedTaskIds: string[]) {
    const status = findStatusOfDraggable(tasksByStatus, taskId);
    if (!status) {
      return;
    }
    const positionById = new Map(tasksByStatus[status].map((task) => [task.id, task.position]));
    const orderedTasks = orderedTaskIds.map((orderedTaskId) => ({
      id: orderedTaskId,
      position: positionById.get(orderedTaskId),
    }));

    await callKanbanFunction("kanban_reorder_task", {
      p_task_id: taskId,
      p_position: getPositionBetweenNeighbors(orderedTasks, taskId),
    });
  }

  async function postDailyUpdate(task: KanbanTask, dailyUpdate: KanbanDailyUpdate, files: File[] = []) {
    const note = describeDailyUpdate(dailyUpdate);
    const uploadedFiles = await uploadUpdateFiles(task, files);
    if (uploadedFiles === null) {
      return;
    }
    await callKanbanFunction("kanban_post_daily_update", {
      p_task_id: task.id,
      p_progress: dailyUpdate.progress,
      p_health: dailyUpdate.health,
      p_next_steps: dailyUpdate.nextSteps,
      p_issues: dailyUpdate.issues,
      p_note: note,
      p_mentioned_user_ids: getMentionedUserIds(note),
      p_attachments: uploadedFiles,
    });
  }

  async function addTaskUpdate(task: KanbanTask, note: string, files: File[] = []) {
    const uploadedFiles = await uploadUpdateFiles(task, files);
    if (uploadedFiles === null) {
      return;
    }
    await callKanbanFunction("kanban_post_task_update", {
      p_task_id: task.id,
      p_note: note,
      p_mentioned_user_ids: getMentionedUserIds(note),
      p_attachments: uploadedFiles,
    });
  }

  async function addUpdateComment(_task: KanbanTask, parentActivityId: string, note: string) {
    await callKanbanFunction("kanban_post_update_comment", {
      p_parent_activity_id: parentActivityId,
      p_note: note,
      p_mentioned_user_ids: getMentionedUserIds(note),
    });
  }

  async function attachFiles(task: KanbanTask, files: File[], note: string) {
    if (!supabase) {
      return;
    }
    const oversizedFile = files.find((file) => file.size > MAX_ATTACHMENT_SIZE_BYTES);
    if (oversizedFile) {
      showOversizedFileToast(oversizedFile.name);
      return;
    }

    for (const file of files) {
      const storagePath = `${task.businessId}/${task.id}/${crypto.randomUUID()}-${toSafeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .upload(storagePath, file, { contentType: file.type || undefined });
      if (uploadError) {
        showRequestErrorToast(uploadError, `upload ${file.name}`);
        continue;
      }
      await callKanbanFunction("kanban_add_attachment", {
        p_task_id: task.id,
        p_file_name: file.name,
        p_size_bytes: file.size,
        p_mime_type: file.type,
        p_storage_path: storagePath,
        p_note: note,
        p_mentioned_user_ids: getMentionedUserIds(note),
      });
    }
  }

  async function removeAttachment(_task: KanbanTask, attachment: KanbanAttachment, note: string) {
    await callKanbanFunction("kanban_remove_attachment", {
      p_attachment_id: attachment.id,
      p_note: note,
      p_mentioned_user_ids: getMentionedUserIds(note),
    });
  }

  useEffect(() => {
    // Initial load for this business, then realtime reloads (RLS filters what arrives).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading external data on mount
    void loadBoard();

    if (!supabase) {
      return;
    }

    function scheduleReload() {
      if (reloadTimeoutRef.current !== null) {
        window.clearTimeout(reloadTimeoutRef.current);
      }
      reloadTimeoutRef.current = window.setTimeout(() => void loadBoard(), REALTIME_RELOAD_DELAY_MS);
    }

    const businessFilter = `business_id=in.(${boardBusinessIdsKey})`;
    const realtimeChannel = supabase
      .channel(`kanban-board-${boardBusinessIdsKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "kanban_tasks", filter: businessFilter }, scheduleReload)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "kanban_activity", filter: businessFilter }, scheduleReload)
      .subscribe();

    return () => {
      if (reloadTimeoutRef.current !== null) {
        window.clearTimeout(reloadTimeoutRef.current);
      }
      void supabase.removeChannel(realtimeChannel);
    };
  }, [supabase, boardBusinessIdsKey, loadBoard]);

  return (
    <KanbanBoardContext.Provider
      value={{
        teamMembers,
        assignableTeamMembers,
        mentionables,
        tasksByStatus,
        // Only the board's businesses are loaded, so a drag snapshot of them is the full state.
        allTasksByStatus: tasksByStatus,
        archivedTasks,
        auditLogEntries,
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
        addUpdateComment,
        attachFiles,
        removeAttachment,
        getTaskPermissions: (task) => getKanbanTaskPermissions(currentUser, task, teamMembers),
        getMoveDeniedReason: (task, newStatus) => getTaskMoveDeniedReason(currentUser, task, newStatus, teamMembers),
      }}
    >
      {children}
    </KanbanBoardContext.Provider>
  );
}

