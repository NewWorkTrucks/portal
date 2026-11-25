/** Portal roles from the user stories (E4-1). */
export type PortalRole = "member" | "department_head" | "admin";

/**
 * Task authority by role (US-3.4). Every role can move, update and submit its own cards; reviewing
 * isn't a role ability, it belongs to whoever assigned the card (US-4.2).
 */
export type KanbanRoleCapabilities = {
  /** Create cards and subtasks. Department heads and admins only. */
  canCreateTasks: boolean;
  /** Edit or rename any card, including your own. Members can't edit cards they were given. */
  canEditAnyTask: boolean;
  canMoveAnyTask: boolean;
  canReassignAnyTask: boolean;
  canArchiveTasks: boolean;
  /** See every card in their businesses, and pick "All cards" or "All businesses" (G13, US-3.6). */
  canViewAllCards: boolean;
};

export type KanbanRoleDefinition = {
  label: string;
  description: string;
  capabilities: KanbanRoleCapabilities;
};

export type KanbanTaskPermissions = {
  canEdit: boolean;
  canRename: boolean;
  canChangeOwner: boolean;
  canArchive: boolean;
  /** Whether the card can be picked up and moved at all. */
  canMove: boolean;
  /** Post the daily update for a card in Working on It (E2-3). */
  canPostDailyUpdate: boolean;
  /** Approve or return a card in Needs Review. Only the card's reviewer, its assigner (US-4.7). */
  canReview: boolean;
  /** Post an update or comment on a card in any stage. Anyone in the card's business can. */
  canAddUpdate: boolean;
  /** Add or remove attachments (E1-4). */
  canManageAttachments: boolean;
};
