import { KANBAN_ROLE_DEFINITIONS } from "@/constants/kanban-role-capabilities";
import { getColumnTitle } from "@/lib/kanban";
import type { KanbanStatus, KanbanTask } from "@/types/kanban";
import type { KanbanTaskPermissions } from "@/types/roles";
import type { TeamMember } from "@/types/team";

function isTaskOwner(user: TeamMember, task: KanbanTask): boolean {
  return task.ownerName === user.name;
}

/**
 * Who reviews `task` when it's submitted (US-4.2): whoever assigned it, unless they gave it to
 * themselves, then the person the owner reports to. Null at the top of the chain, where nobody is
 * above the owner and they close the card themselves. Mirrors kanban_private.task_reviewer.
 */
export function getTaskReviewerName(task: KanbanTask, teamMembers: TeamMember[]): string | null {
  const businessMembers = teamMembers.filter((teamMember) => teamMember.businessIds.includes(task.businessId));
  if (task.assignedByName && task.assignedByName !== task.ownerName) {
    const assigner = businessMembers.find((teamMember) => teamMember.name === task.assignedByName);
    if (assigner) {
      return assigner.name;
    }
  }
  const owner = teamMembers.find((teamMember) => teamMember.name === task.ownerName);
  const ownerManager = businessMembers.find((teamMember) => teamMember.id === owner?.reportsToId);
  return ownerManager?.name ?? null;
}

export function getKanbanTaskPermissions(user: TeamMember, task: KanbanTask): KanbanTaskPermissions {
  const capabilities = KANBAN_ROLE_DEFINITIONS[user.role].capabilities;
  const isOwner = isTaskOwner(user, task);
  // US-3.4: only department heads and admins edit cards; members work on the ones they're given.
  const canEdit = capabilities.canEditAnyTask;
  // US-4.7: only the card's reviewer, its assigner, approves or returns it.
  const isReviewer = task.status === "needs-review" && task.reviewerName === user.name;

  return {
    canEdit,
    canRename: canEdit,
    canChangeOwner: capabilities.canReassignAnyTask,
    canArchive: capabilities.canArchiveTasks,
    canMove: isOwner || capabilities.canMoveAnyTask || isReviewer,
    canPostDailyUpdate: task.status === "working-on-it" && (isOwner || canEdit),
    canReview: isReviewer,
    canManageAttachments: isOwner || canEdit,
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
  teamMembers: TeamMember[],
): string | null {
  const taskPermissions = getKanbanTaskPermissions(user, task);

  if (!taskPermissions.canMove) {
    return "You can only move your own cards.";
  }
  if (newStatus === "done" && !taskPermissions.canReview) {
    // Top of the chain, on a card they gave themselves: nobody else can review it.
    if (isTaskOwner(user, task) && getTaskReviewerName(task, teamMembers) === null) {
      return null;
    }
    if (isTaskOwner(user, task)) {
      return `You can't mark your own work Done. Submit it through ${getColumnTitle("needs-review")}.`;
    }
    return `Only the person who assigned this card can approve it, once it's in ${getColumnTitle("needs-review")}.`;
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
