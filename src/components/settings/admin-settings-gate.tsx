"use client";

import type { ReactNode } from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import SettingsSection from "@/components/settings/settings-section";

type AdminSettingsGateProps = {
  children: ReactNode;
};

/** Hides an admin page from other roles. This is display only: the database enforces the permission. */
export default function AdminSettingsGate({ children }: AdminSettingsGateProps) {
  const { currentUser, currentBusiness } = useCurrentUser();

  if (currentUser.role !== "admin") {
    return (
      <SettingsSection title="Admins only" description={`You need the Admin role in ${currentBusiness.shortName} to open this page.`}>
        <p className="text-sm text-muted-foreground">Ask the development lead if you need access.</p>
      </SettingsSection>
    );
  }

  return children;
}
