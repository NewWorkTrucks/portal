import { KANBAN_ROLE_DEFINITIONS } from "@/constants/kanban-role-capabilities";
import { getColumnTitle } from "@/lib/kanban";
import type { KanbanStatus, KanbanTask } from "@/types/kanban";
import type { KanbanTaskPermissions } from "@/types/roles";
import type { TeamMember } from "@/types/team";

function isTaskOwner(user: TeamMember, task: KanbanTask): boolean {
  return task.ownerName === user.name;
}

function isOwnerInReportingLine(user: TeamMember, task: KanbanTask, everyone: TeamMember[]): boolean {
  const owner = everyone.find((teamMember) => teamMember.name === task.ownerName);
  return owner ? isInReportingLine(user, owner, everyone) : false;
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

/**
 * Whether `task` is part of `user`'s own work (G13, US-3.6): they own it, gave it out or review it,
 * it is the parent of a subtask they own, or they were @mentioned on it. Mirrors
 * kanban_private.can_see_task, which shows members only these cards.
 */
export function isTaskPartOfUsersWork(
  task: KanbanTask,
  user: TeamMember,
  allTasks: readonly KanbanTask[],
  mentionedTaskIds: ReadonlySet<string>,
  teamMembers: TeamMember[],
): boolean {
  return (
    task.ownerName === user.name ||
    task.assignedByName === user.name ||
    task.reviewerName === user.name ||
    getTaskReviewerName(task, teamMembers) === user.name ||
    allTasks.some((otherTask) => otherTask.parentTaskId === task.id && otherTask.ownerName === user.name) ||
    mentionedTaskIds.has(task.id)
  );
}

/**
 * Whether `person` is `manager` or anyone below them in the reporting chain (G6, US-3.5).
 * Mirrors kanban_private.is_in_reporting_line. `everyone` is used to walk up the chain.
 */
export function isInReportingLine(manager: TeamMember, person: TeamMember, everyone: TeamMember[]): boolean {
  const visitedIds = new Set<string>();
  let currentPerson: TeamMember | undefined = person;
  while (currentPerson && !visitedIds.has(currentPerson.id)) {
    if (currentPerson.id === manager.id) {
      return true;
    }
    visitedIds.add(currentPerson.id);
    const managerId: string | undefined = currentPerson.reportsToId;
    currentPerson = everyone.find((teamMember) => teamMember.id === managerId);
  }
  return false;
}

/** Who `user` may give a card to: themselves and the people who report to them (G6, US-3.5). */
export function getAssignableTeamMembers(
  user: TeamMember,
  candidates: TeamMember[],
  everyone: TeamMember[],
): TeamMember[] {
  return candidates.filter((candidate) => isInReportingLine(user, candidate, everyone));
}

export function getKanbanTaskPermissions(
  user: TeamMember,
  task: KanbanTask,
  everyone: TeamMember[],
): KanbanTaskPermissions {
  const capabilities = KANBAN_ROLE_DEFINITIONS[user.role].capabilities;
  const isOwner = isTaskOwner(user, task);
  // US-3.4: only department heads and admins edit cards; members work on the ones they're given.
  const canEdit = capabilities.canEditAnyTask;
  // US-4.7: only the card's reviewer, its assigner, approves or returns it.
  const isReviewer = task.status === "needs-review" && task.reviewerName === user.name;

  return {
    canEdit,
    canRename: canEdit,
    // G6: only cards held by you or people who report to you can be handed on.
    canChangeOwner:
      capabilities.canReassignAnyTask && isOwnerInReportingLine(user, task, everyone),
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
  const taskPermissions = getKanbanTaskPermissions(user, task, teamMembers);

  if (!taskPermissions.canMove) {
    return "You can only move your own cards.";
  }
  // US-4.8: a card in review is approved or returned by its reviewer and goes nowhere else.
  if (task.status === "needs-review") {
    if (!taskPermissions.canReview) {
      return "Only the reviewer can approve or return a card in Needs Review.";
    }
    return newStatus === "done" || newStatus === "working-on-it"
      ? null
      : `A card in ${getColumnTitle("needs-review")} is either approved (${getColumnTitle("done")}) or returned (${getColumnTitle("working-on-it")}).`;
  }
  if (newStatus === "needs-review" && task.status !== "working-on-it") {
    return `Only a card in ${getColumnTitle("working-on-it")} can be submitted for review.`;
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
