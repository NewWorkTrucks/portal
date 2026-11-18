"use client";

import { Building2, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "@/components/current-user-provider";
import BusinessSwitcherMenu from "@/components/layout/business-switcher-menu";
import SettingsMenu from "@/components/layout/settings-menu";
import UserProfile from "@/components/layout/user-profile";
import UserSimulationMenu from "@/components/layout/user-simulation-menu";
import { IS_USER_SIMULATION_ENABLED } from "@/constants/feature-flags";
import { cn } from "@/lib/utils";

export default function AppHeader() {
  const { isSimulatingUser, currentBusiness } = useCurrentUser();

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
        {/* Build-time constant, so production never shows these development menus. */}
        <span data-tour="business" className="flex">
          {IS_USER_SIMULATION_ENABLED ? (
            <BusinessSwitcherMenu />
          ) : (
            <span className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground sm:flex">
              <Building2 aria-hidden className="size-3.5" />
              {currentBusiness.shortName}
            </span>
          )}
        </span>
        {IS_USER_SIMULATION_ENABLED && <UserSimulationMenu />}
        <UserProfile />
        <SettingsMenu />
      </div>
    </header>
  );
}
