import type { TeamMember } from "@/types/team";

export type CurrentUserContextValue = {
  teamMembers: TeamMember[];
  /** The account that is actually signed in. */
  signedInUser: TeamMember;
  /** Who the app acts as: the simulated user while "viewing as", otherwise the signed-in user. */
  currentUser: TeamMember;
  isSimulatingUser: boolean;
  /** Pass the signed-in user's id (or null) to stop viewing as someone else. */
  simulateUser: (teamMemberId: string | null) => void;
};
