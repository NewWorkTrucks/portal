"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/components/current-user-provider";
import { Badge } from "@/components/ui/badge";
import { SETTINGS_NAVIGATION_GROUPS } from "@/constants/settings-navigation";
import { cn } from "@/lib/utils";

export default function SettingsSidebar() {
  const { currentUser } = useCurrentUser();
  const pathname = usePathname();

  const visibleNavigationGroups = SETTINGS_NAVIGATION_GROUPS.map((navigationGroup) => ({
    ...navigationGroup,
    items: navigationGroup.items.filter((navigationItem) => !navigationItem.isAdminOnly || currentUser.role === "admin"),
  })).filter((navigationGroup) => navigationGroup.items.length > 0);

  return (
    <nav aria-label="Settings" className="flex gap-4 overflow-x-auto pb-1 md:flex-col md:gap-5 md:overflow-visible md:pb-0">
      {visibleNavigationGroups.map((navigationGroup) => (
        <div key={navigationGroup.label} className="flex shrink-0 flex-col gap-1">
          <h2 className="px-2 text-xs font-medium text-muted-foreground">{navigationGroup.label}</h2>
          <ul className="flex gap-1 md:flex-col">
            {navigationGroup.items.map((navigationItem) => {
              const isCurrentPage = pathname === navigationItem.href;

              return (
                <li key={navigationItem.href}>
                  <Link
                    href={navigationItem.href}
                    aria-current={isCurrentPage ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm whitespace-nowrap transition-colors hover:bg-muted",
                      isCurrentPage && "bg-muted font-medium",
                    )}
                  >
                    <navigationItem.Icon aria-hidden className="size-4 shrink-0" />
                    {navigationItem.label}
                    {navigationItem.isBeta && (
                      <Badge variant="secondary" className="ml-auto">
                        Beta
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
