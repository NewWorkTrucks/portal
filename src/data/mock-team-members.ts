import type { TeamMember } from "@/types/team";

// Roles follow the personas in the user stories. TODO: Confirm Erik's role (leadership is a
// mention group, not a role) and load roles from the backend once admins can edit them (E4-1).
export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  { id: "member-alexis", name: "Alexis", jobTitle: "Development Lead", role: "admin" },
  { id: "member-edward", name: "Edward", jobTitle: "Developer", role: "member" },
  { id: "member-miggy", name: "Miggy", jobTitle: "Operations Manager", role: "coordinator" },
  { id: "member-casey", name: "Casey", jobTitle: "Team Member", role: "member" },
  { id: "member-lorenzo", name: "Lorenzo", jobTitle: "Team Member", role: "member" },
  { id: "member-erik", name: "Erik", jobTitle: "Leadership", role: "reviewer" },
  { id: "member-chris", name: "Chris", jobTitle: "Leadership", role: "reviewer" },
  { id: "member-kc", name: "Kc", jobTitle: "Leadership", role: "reviewer" },
];
