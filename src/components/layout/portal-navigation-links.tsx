"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PORTAL_NAVIGATION_GROUPS } from "@/constants/portal-navigation";
import { cn } from "@/lib/utils";
import type { PortalNavigationLinksProps } from "@/types/portal-navigation";

/** A link is current on its own page and on any page under it (the audit log counts as Kanban). */
function getIsCurrentSection(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PortalNavigationLinks({ isCollapsed = false, onSelectLink }: PortalNavigationLinksProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Portal" className="flex flex-col gap-5">
      {PORTAL_NAVIGATION_GROUPS.map((navigationGroup) => (
        <div key={navigationGroup.label} className="flex flex-col gap-1">
          <h2 className={cn("px-2 text-xs font-medium text-muted-foreground", isCollapsed && "sr-only")}>
            {navigationGroup.label}
          </h2>
          <ul className="flex flex-col gap-1">
            {navigationGroup.items.map((navigationItem) => {
              const isCurrentPage = getIsCurrentSection(pathname, navigationItem.href);

              return (
                <li key={navigationItem.href}>
                  <Link
                    href={navigationItem.href}
                    aria-current={isCurrentPage ? "page" : undefined}
                    title={isCollapsed ? navigationItem.label : undefined}
                    onClick={onSelectLink}
                    className={cn(
                      "flex min-h-11 items-center gap-2 rounded-md px-2 py-1.5 text-sm whitespace-nowrap transition-colors hover:bg-muted md:min-h-9",
                      isCollapsed && "justify-center",
                      isCurrentPage && "bg-muted font-medium",
                    )}
                  >
                    <navigationItem.Icon aria-hidden className="size-4 shrink-0" />
                    <span className={cn(isCollapsed && "sr-only")}>{navigationItem.label}</span>
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
