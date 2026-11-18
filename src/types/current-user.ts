import type { Business } from "@/types/business";
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
  /** Businesses the current user belongs to. */
  availableBusinesses: Business[];
  /** The business whose data the app shows; always one the current user belongs to (E4-2). */
  currentBusiness: Business;
  /** Switch which business we are viewing: development-only in mock mode, real in live mode. */
  selectBusiness: (businessId: string) => void;
};
