"use client";

import type { ReactNode } from "react";
import { CurrentUserProvider } from "@/components/current-user-provider";
import { useDataMode } from "@/components/data-mode-provider";
import LiveCurrentUserProvider from "@/components/live/live-current-user-provider";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";
import { MOCK_SIGNED_IN_USER_ID } from "@/data/mock-current-user";
import { MOCK_TEAM_MEMBERS } from "@/data/mock-team-members";

type PortalCurrentUserProviderProps = {
  children: ReactNode;
};

/** Mock mode uses the sample team; live mode uses the signed-in Supabase user. */
export function PortalCurrentUserProvider({ children }: PortalCurrentUserProviderProps) {
  const { dataMode } = useDataMode();

  if (dataMode === "live") {
    return <LiveCurrentUserProvider>{children}</LiveCurrentUserProvider>;
  }

  return (
    <CurrentUserProvider
      teamMembers={MOCK_TEAM_MEMBERS}
      businesses={MOCK_BUSINESSES}
      signedInUserId={MOCK_SIGNED_IN_USER_ID}
    >
      {children}
    </CurrentUserProvider>
  );
}
