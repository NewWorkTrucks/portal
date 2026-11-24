"use client";

import { LayoutDashboard, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import PortalNavigationLinks from "@/components/layout/portal-navigation-links";
import { Button } from "@/components/ui/button";
import { PORTAL_SIDEBAR_COLLAPSED_STORAGE_KEY } from "@/constants/portal-navigation";
import { readStoredValue, writeStoredValue } from "@/lib/browser-storage";
import { cn } from "@/lib/utils";

/**
 * Full-height left navigation from md up, with the logo and portal name at the top.
 * Phones use the header's menu button instead.
 */
export default function PortalSidebar() {
  // Expanded on the server; the stored choice is read after hydration.
  const [isCollapsed, setIsCollapsed] = useState(false);

  const collapseToggleLabel = isCollapsed ? "Expand navigation" : "Collapse navigation";

  function handleClickCollapseToggle() {
    const nextIsCollapsed = !isCollapsed;
    setIsCollapsed(nextIsCollapsed);
    writeStoredValue(PORTAL_SIDEBAR_COLLAPSED_STORAGE_KEY, String(nextIsCollapsed));
  }

  const collapseToggle = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={collapseToggleLabel}
      aria-expanded={!isCollapsed}
      title={collapseToggleLabel}
      onClick={handleClickCollapseToggle}
      className="shrink-0"
    >
      {isCollapsed ? <PanelLeftOpen aria-hidden /> : <PanelLeftClose aria-hidden />}
    </Button>
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of browser-only storage
    setIsCollapsed(readStoredValue(PORTAL_SIDEBAR_COLLAPSED_STORAGE_KEY) === "true");
  }, []);

  return (
    <aside
      className={cn(
        "glass-panel relative z-20 hidden shrink-0 flex-col border-r md:flex",
        isCollapsed ? "w-14" : "w-60",
      )}
    >
      {/* Same height as the header, so their bottom borders line up. The toggle sits up here so it's always in view. */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b",
          isCollapsed ? "justify-center px-2" : "justify-between gap-2 pr-2 pl-4",
        )}
      >
        <Link
          href="/"
          title={isCollapsed ? "FFL Operations Portal" : undefined}
          className="flex min-w-0 items-center gap-2 font-heading text-sm font-semibold whitespace-nowrap"
        >
          <LayoutDashboard aria-hidden className="size-4 shrink-0 text-primary" />
          <span className={cn("truncate", isCollapsed && "sr-only")}>FFL Operations Portal</span>
        </Link>
        {!isCollapsed && collapseToggle}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
        {isCollapsed && <div className="flex justify-center">{collapseToggle}</div>}
        <PortalNavigationLinks isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}
