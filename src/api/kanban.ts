import type { KanbanStatus, KanbanTaskFormValues } from "@/types/kanban";

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

export async function moveKanbanTask(taskId: string, status: KanbanStatus, note: string) {
  // TODO: Replace with the move-task endpoint (e.g. PATCH /kanban/tasks/:taskId/status).
  window.alert(`TODO: move task endpoint\n\nTask: ${taskId}\nNew status: ${status}\nNote: ${note}`);
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
