import { KANBAN_ROLE_DEFINITIONS } from "@/constants/kanban-role-capabilities";
import { getColumnTitle } from "@/lib/kanban";
import type { KanbanStatus, KanbanTask } from "@/types/kanban";
import type { KanbanTaskPermissions } from "@/types/roles";
import type { TeamMember } from "@/types/team";

function isTaskOwner(user: TeamMember, task: KanbanTask): boolean {
  return task.ownerName === user.name;
}

export function getKanbanTaskPermissions(user: TeamMember, task: KanbanTask): KanbanTaskPermissions {
  const capabilities = KANBAN_ROLE_DEFINITIONS[user.role].capabilities;
  const isOwner = isTaskOwner(user, task);
  const canEdit = isOwner || capabilities.canEditAnyTask;

  return {
    canEdit,
    canRename: canEdit,
    canChangeOwner: isOwner || capabilities.canReassignAnyTask,
    canArchive: capabilities.canArchiveTasks,
    canMove:
      isOwner ||
      capabilities.canMoveAnyTask ||
      (capabilities.canReviewTasks && task.status === "needs-review"),
  };
}

/** Why `user` may not move `task` to `newStatus`, or null when the move is allowed. */
export function getTaskMoveDeniedReason(
  user: TeamMember,
  task: KanbanTask,
  newStatus: KanbanStatus,
): string | null {
  const roleDefinition = KANBAN_ROLE_DEFINITIONS[user.role];

  if (!getKanbanTaskPermissions(user, task).canMove) {
    return `As a ${roleDefinition.label}, you can only move your own cards.`;
  }
  if (newStatus === "done" && !roleDefinition.capabilities.canMoveToDone) {
    return `Only reviewers, coordinators and admins can move cards to ${getColumnTitle("done")}. Submit it through ${getColumnTitle("needs-review")}.`;
  }

  return null;
}

export class KanbanPermissionError extends Error {}

/** Throws when an operation is not allowed. The board provider calls this before every change. */
export function assertKanbanPermission(isAllowed: boolean, deniedMessage: string): void {
  if (!isAllowed) {
    throw new KanbanPermissionError(deniedMessage);
  }
}
