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

  // Coordinators and admins may close their own cards; reviewers may not approve their own work.
  const canApproveOwnWork = capabilities.canMoveAnyTask;

  return {
    canEdit,
    canRename: canEdit,
    canChangeOwner: isOwner || capabilities.canReassignAnyTask,
    canArchive: capabilities.canArchiveTasks,
    canMove:
      isOwner ||
      capabilities.canMoveAnyTask ||
      (capabilities.canReviewTasks && task.status === "needs-review"),
    canPostDailyUpdate: task.status === "working-on-it" && canEdit,
    canReview:
      task.status === "needs-review" &&
      capabilities.canReviewTasks &&
      capabilities.canMoveToDone &&
      (!isOwner || canApproveOwnWork),
    canManageAttachments: canEdit,
    // Updates don't change the card, so anyone who can see it may post one; the business
    // check in the board provider keeps it to the card's own business.
    canAddUpdate: true,
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
  if (newStatus === "done" && isTaskOwner(user, task) && !roleDefinition.capabilities.canMoveAnyTask) {
    return `You can't approve your own work. Submit it through ${getColumnTitle("needs-review")} for someone else to review.`;
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
