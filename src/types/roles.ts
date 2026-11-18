/** Portal roles from the user stories (E4-1). */
export type PortalRole = "member" | "reviewer" | "coordinator" | "admin";

/** What a role may do on cards it does not own. Every role can always work on its own cards. */
export type KanbanRoleCapabilities = {
  canEditAnyTask: boolean;
  canMoveAnyTask: boolean;
  /** Reviewers: move any card out of Needs Review (approve or return it, E2-5). */
  canReviewTasks: boolean;
  /** Only authorized accounts may mark work Done, even on their own cards. */
  canMoveToDone: boolean;
  canReassignAnyTask: boolean;
  canArchiveTasks: boolean;
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
};
