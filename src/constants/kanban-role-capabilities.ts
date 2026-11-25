import type { KanbanRoleDefinition, PortalRole } from "@/types/roles";

// Task authority from the Revisions v1 stories (US-3.4, US-4.2). Admins keep task authority until
// G5 (US-3.8) separates software admin from it. Supabase enforces the same rules in kanban_private.can.
export const KANBAN_ROLE_DEFINITIONS: Record<PortalRole, KanbanRoleDefinition> = {
  member: {
    label: "Member",
    description: "Works on the cards they're given: moves them, posts updates and submits them for review.",
    capabilities: {
      canCreateTasks: false,
      canEditAnyTask: false,
      canMoveAnyTask: false,
      canReassignAnyTask: false,
      canArchiveTasks: false,
      canViewAllCards: false,
    },
  },
  department_head: {
    label: "Department head",
    description: "Creates, edits, assigns and archives cards, and reviews the cards they assign.",
    capabilities: {
      canCreateTasks: true,
      canEditAnyTask: true,
      canMoveAnyTask: true,
      canReassignAnyTask: true,
      canArchiveTasks: true,
      canViewAllCards: true,
    },
  },
  admin: {
    label: "Admin",
    description: "Same card authority as a department head, plus board settings.",
    capabilities: {
      canCreateTasks: true,
      canEditAnyTask: true,
      canMoveAnyTask: true,
      canReassignAnyTask: true,
      canArchiveTasks: true,
      canViewAllCards: true,
    },
  },
};
