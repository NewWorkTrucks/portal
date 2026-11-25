import type { TeamMember } from "@/types/team";

// Business memberships are mock data for testing isolation (E4-2).
// Reporting: Morgan reports to Avery; Sam, Quinn and Rowan report to Morgan (G3).
// Roles follow the personas in the user stories. TODO: Confirm Jordan's role (leadership is a
// mention group, not a role) and load roles from the backend once admins can edit them (E4-1).
export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  { id: "member-avery", name: "Avery", jobTitle: "Development Lead", role: "admin", businessIds: ["business-nwt", "business-verilot", "business-rwt"] },
  { id: "member-sam", name: "Sam", jobTitle: "Developer", role: "member", reportsToId: "member-morgan", businessIds: ["business-nwt"] },
  { id: "member-morgan", name: "Morgan", jobTitle: "Operations Manager", role: "department_head", reportsToId: "member-avery", businessIds: ["business-nwt", "business-rwt"] },
  { id: "member-quinn", name: "Quinn", jobTitle: "Team Member", role: "member", reportsToId: "member-morgan", businessIds: ["business-nwt"] },
  { id: "member-rowan", name: "Rowan", jobTitle: "Team Member", role: "member", reportsToId: "member-morgan", businessIds: ["business-nwt", "business-verilot"] },
  { id: "member-jordan", name: "Jordan", jobTitle: "Leadership", role: "reviewer", businessIds: ["business-nwt", "business-verilot", "business-rwt"] },
  { id: "member-riley", name: "Riley", jobTitle: "Leadership", role: "reviewer", businessIds: ["business-nwt", "business-verilot", "business-rwt"] },
  { id: "member-taylor", name: "Taylor", jobTitle: "Leadership", role: "reviewer", businessIds: ["business-nwt", "business-verilot", "business-rwt"] },
];
