"use client";

import { useMemo } from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import { useDevicePreferences } from "@/components/device-preferences-provider";
import { KANBAN_ROLE_DEFINITIONS } from "@/constants/kanban-role-capabilities";
import type { Business } from "@/types/business";

/**
 * The businesses whose cards the board shows: the one picked in the header, or every business you
 * belong to when a head or admin picks "All businesses" (G13, US-3.6).
 */
export function useBoardBusinesses(): Business[] {
  const { currentUser, availableBusinesses, currentBusiness } = useCurrentUser();
  const { boardBusinessScope } = useDevicePreferences();

  const isShowingAllBusinesses =
    KANBAN_ROLE_DEFINITIONS[currentUser.role].capabilities.canViewAllCards && boardBusinessScope === "all";

  return useMemo(
    () => (isShowingAllBusinesses ? availableBusinesses : [currentBusiness]),
    [availableBusinesses, currentBusiness, isShowingAllBusinesses],
  );
}
