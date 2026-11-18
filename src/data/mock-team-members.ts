import type { TeamMember } from "@/types/team";

// Business memberships are mock data for testing isolation (E4-2).
// Roles follow the personas in the user stories. TODO: Confirm Erik's role (leadership is a
// mention group, not a role) and load roles from the backend once admins can edit them (E4-1).
export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  { id: "member-alexis", name: "Alexis", jobTitle: "Development Lead", role: "admin", businessIds: ["business-nwt", "business-verilot", "business-rwt"] },
  { id: "member-edward", name: "Edward", jobTitle: "Developer", role: "member", businessIds: ["business-nwt"] },
  { id: "member-miggy", name: "Miggy", jobTitle: "Operations Manager", role: "coordinator", businessIds: ["business-nwt", "business-rwt"] },
  { id: "member-casey", name: "Casey", jobTitle: "Team Member", role: "member", businessIds: ["business-nwt"] },
  { id: "member-lorenzo", name: "Lorenzo", jobTitle: "Team Member", role: "member", businessIds: ["business-nwt", "business-verilot"] },
  { id: "member-erik", name: "Erik", jobTitle: "Leadership", role: "reviewer", businessIds: ["business-nwt", "business-verilot", "business-rwt"] },
  { id: "member-chris", name: "Chris", jobTitle: "Leadership", role: "reviewer", businessIds: ["business-nwt", "business-verilot", "business-rwt"] },
  { id: "member-kc", name: "Kc", jobTitle: "Leadership", role: "reviewer", businessIds: ["business-nwt", "business-verilot", "business-rwt"] },
];
