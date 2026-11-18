import type { KanbanAttachment } from "@/types/attachment";
import type { KanbanTaskFormValues } from "@/types/kanban";
import type { KanbanDailyUpdate, KanbanStageTransition } from "@/types/kanban-stages";

// These calls stand in for backend endpoints that don't exist yet. Each one
// alerts instead of sending a request; the board updates its local state after.

export async function createKanbanTask(values: KanbanTaskFormValues) {
  // TODO: Replace with the create-task endpoint (e.g. POST /kanban/tasks).
  window.alert(`TODO: create task endpoint\n\n${JSON.stringify(values, null, 2)}`);
}

export async function updateKanbanTask(taskId: string, values: KanbanTaskFormValues) {
  // TODO: Replace with the update-task endpoint (e.g. PATCH /kanban/tasks/:taskId).
  window.alert(`TODO: update task endpoint\n\nTask: ${taskId}\n${JSON.stringify(values, null, 2)}`);
}

export async function renameKanbanTask(taskId: string, title: string, note: string) {
  // TODO: Replace with the rename-task endpoint (e.g. PATCH /kanban/tasks/:taskId).
  window.alert(`TODO: rename task endpoint\n\nTask: ${taskId}\nNew title: ${title}\nNote: ${note}`);
}

export async function transitionKanbanTask(taskId: string, transition: KanbanStageTransition) {
  // TODO: Replace with the stage-transition endpoint (e.g. POST /kanban/tasks/:taskId/transitions).
  // The backend must validate the stage's required fields, and schedule the follow-up (Waiting)
  // or revisit (Deferred) reminder (E2-6, E2-8, E3-6).
  window.alert(`TODO: stage transition endpoint\n\nTask: ${taskId}\n${JSON.stringify(transition, null, 2)}`);
}

export async function postKanbanDailyUpdate(taskId: string, dailyUpdate: KanbanDailyUpdate) {
  // TODO: Replace with the daily-update endpoint (e.g. POST /kanban/tasks/:taskId/updates) (E2-3).
  window.alert(`TODO: daily update endpoint\n\nTask: ${taskId}\n${JSON.stringify(dailyUpdate, null, 2)}`);
}

export async function postKanbanTaskUpdate(taskId: string, note: string) {
  // TODO: Replace with the card-update endpoint (e.g. POST /kanban/tasks/:taskId/updates).
  window.alert(`TODO: card update endpoint\n\nTask: ${taskId}\nNote: ${note}`);
}

/** Uploads files and returns their stored metadata. */
export async function uploadKanbanAttachments(
  taskId: string,
  files: File[],
  uploadedByName: string,
  note: string,
): Promise<KanbanAttachment[]> {
  // TODO: Replace with an upload to Supabase Storage (max 25 MB per file) plus an endpoint that
  // saves the attachment records (E1-4). Until then files stay in this browser as object URLs.
  window.alert(
    `TODO: upload attachments endpoint\n\nTask: ${taskId}\nFiles: ${files.map((file) => file.name).join(", ")}\nNote: ${note}`,
  );

  return files.map((file) => ({
    id: crypto.randomUUID(),
    fileName: file.name,
    sizeBytes: file.size,
    mimeType: file.type || "application/octet-stream",
    uploadedByName,
    uploadedAt: new Date().toISOString(),
    url: URL.createObjectURL(file),
  }));
}

export async function removeKanbanAttachment(taskId: string, attachmentId: string, note: string) {
  // TODO: Replace with the remove-attachment endpoint (e.g. DELETE /kanban/tasks/:taskId/attachments/:id).
  window.alert(`TODO: remove attachment endpoint\n\nTask: ${taskId}\nAttachment: ${attachmentId}\nNote: ${note}`);
}

export async function archiveKanbanTask(taskId: string, note: string) {
  // TODO: Replace with the archive-task endpoint (e.g. POST /kanban/tasks/:taskId/archive).
  // Archive, never hard-delete, so the card's activity log stays intact (E1-5).
  window.alert(`TODO: archive task endpoint\n\nTask: ${taskId}\nNote: ${note}`);
}

export async function changeKanbanTaskOwner(taskId: string, ownerName: string, note: string) {
  // TODO: Replace with the change-owner endpoint (e.g. PATCH /kanban/tasks/:taskId/owner).
  window.alert(`TODO: change task owner endpoint\n\nTask: ${taskId}\nNew owner: ${ownerName}\nNote: ${note}`);
}

export async function notifyMentionedUsers(
  taskId: string,
  mentionedNames: readonly string[],
  note: string,
) {
  // TODO: Replace with the notifications endpoint (e.g. POST /notifications) that sends in-app
  // and email notifications to everyone mentioned, within 1 minute (E3-3).
  window.alert(
    `TODO: notify mentioned users endpoint\n\nTask: ${taskId}\nNotify: ${mentionedNames.join(", ")}\nNote: ${note}`,
  );
}

// TODO: Replace with the activity-log endpoints (e.g. GET /kanban/tasks/:taskId/activity).
// The backend must store entries append-only (no update/delete) with user and timestamp (E1-5).
