"use client";

import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "@/components/current-user-provider";
import SettingsMenu from "@/components/layout/settings-menu";
import UserProfile from "@/components/layout/user-profile";
import UserSimulationMenu from "@/components/layout/user-simulation-menu";
import { IS_USER_SIMULATION_ENABLED } from "@/constants/feature-flags";
import { cn } from "@/lib/utils";

export default function AppHeader() {
  const { isSimulatingUser } = useCurrentUser();

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-6",
        isSimulatingUser && "border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10",
      )}
    >
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 font-heading text-sm font-semibold whitespace-nowrap"
      >
        <LayoutDashboard aria-hidden className="size-4 text-primary" />
        <span className="sm:hidden">FFL</span>
        <span className="hidden sm:inline">FFL Operations Portal</span>
      </Link>

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {/* Build-time constant, so production bundles drop the menu entirely. */}
        {IS_USER_SIMULATION_ENABLED && <UserSimulationMenu />}
        <UserProfile />
        <SettingsMenu />
      </div>
    </header>
  );
}
