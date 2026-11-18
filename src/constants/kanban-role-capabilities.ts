import type { KanbanRoleDefinition, PortalRole } from "@/types/roles";

// Proposed defaults. TODO: Confirm with Miggy before launch; the user stories leave open
// "who can move cards: owner only, or reviewers too?" and who may reassign work.
// TODO: Mirror these rules in Supabase RLS on every table (E4-1). The UI checks are not security.
export const KANBAN_ROLE_DEFINITIONS: Record<PortalRole, KanbanRoleDefinition> = {
  member: {
    label: "Member",
    description: "Works on their own cards. Can't mark work Done or archive.",
    capabilities: {
      canEditAnyTask: false,
      canMoveAnyTask: false,
      canReviewTasks: false,
      canMoveToDone: false,
      canReassignAnyTask: false,
      canArchiveTasks: false,
    },
  },
  reviewer: {
    label: "Reviewer",
    description: "Approves or returns cards in Needs Review, and can mark work Done.",
    capabilities: {
      canEditAnyTask: false,
      canMoveAnyTask: false,
      canReviewTasks: true,
      canMoveToDone: true,
      canReassignAnyTask: false,
      canArchiveTasks: false,
    },
  },
  coordinator: {
    label: "Coordinator",
    description: "Sees and manages every card: move, reassign, edit and archive.",
    capabilities: {
      canEditAnyTask: true,
      canMoveAnyTask: true,
      canReviewTasks: true,
      canMoveToDone: true,
      canReassignAnyTask: true,
      canArchiveTasks: true,
    },
  },
  admin: {
    label: "Admin",
    description: "Full access, including board configuration.",
    capabilities: {
      canEditAnyTask: true,
      canMoveAnyTask: true,
      canReviewTasks: true,
      canMoveToDone: true,
      canReassignAnyTask: true,
      canArchiveTasks: true,
    },
  },
};
