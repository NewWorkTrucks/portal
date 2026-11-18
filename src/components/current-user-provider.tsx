"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { IS_USER_SIMULATION_ENABLED } from "@/constants/feature-flags";
import type { Business } from "@/types/business";
import type { CurrentUserContextValue } from "@/types/current-user";
import type { TeamMember } from "@/types/team";

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

type CurrentUserProviderProps = {
  teamMembers: TeamMember[];
  businesses: Business[];
  signedInUserId: string;
  children: ReactNode;
};

/**
 * Knows who is signed in and, in development only, who we are "viewing as".
 * Simulation only changes what this client shows and who it attributes actions to.
 * TODO: Once auth exists, the backend must authorize every request by the real session,
 * never by the simulated user.
 */
export function CurrentUserProvider({
  teamMembers,
  businesses,
  signedInUserId,
  children,
}: CurrentUserProviderProps) {
  const [simulatedUserId, setSimulatedUserId] = useState<string | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  const signedInUser =
    teamMembers.find((teamMember) => teamMember.id === signedInUserId) ?? teamMembers[0];
  const simulatedUser = IS_USER_SIMULATION_ENABLED
    ? teamMembers.find((teamMember) => teamMember.id === simulatedUserId)
    : undefined;
  const currentUser = simulatedUser ?? signedInUser;
  const availableBusinesses = businesses.filter((business) =>
    currentUser.businessIds.includes(business.id),
  );
  // Falls back to the user's first business, e.g. after viewing as someone outside the selected one.
  // TODO: Production picks the business from the signed-in session; switching is development-only for now.
  const currentBusiness =
    availableBusinesses.find((business) => business.id === selectedBusinessId) ??
    availableBusinesses[0] ??
    businesses[0];

  function simulateUser(teamMemberId: string | null) {
    if (!IS_USER_SIMULATION_ENABLED) {
      return;
    }

    setSimulatedUserId(teamMemberId === signedInUser.id ? null : teamMemberId);
  }

  function selectBusiness(businessId: string) {
    if (IS_USER_SIMULATION_ENABLED) {
      setSelectedBusinessId(businessId);
    }
  }

  return (
    <CurrentUserContext.Provider
      value={{
        teamMembers,
        signedInUser,
        currentUser,
        isSimulatingUser: currentUser.id !== signedInUser.id,
        simulateUser,
        availableBusinesses,
        currentBusiness,
        selectBusiness,
      }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserContextValue {
  const currentUserContext = useContext(CurrentUserContext);

  if (!currentUserContext) {
    throw new Error("useCurrentUser must be used inside <CurrentUserProvider>.");
  }

  return currentUserContext;
}
