import { KanbanSquare, LayoutDashboard, ScrollText } from "lucide-react";
import type { PortalNavigationGroup } from "@/types/portal-navigation";

export const PORTAL_SIDEBAR_COLLAPSED_STORAGE_KEY = "ffl-portal-sidebar-collapsed";

export const PORTAL_NAVIGATION_GROUPS: PortalNavigationGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard },
      { label: "Kanban", href: "/kanban", Icon: KanbanSquare },
    ],
  },
];

/** Shown only to people on the access log viewer list (US-9.3). See useCanViewAccessLog. */
export const PORTAL_VIEWER_NAVIGATION_GROUP: PortalNavigationGroup = {
  label: "Admin",
  items: [{ label: "Access log", href: "/access-log", Icon: ScrollText }],
};
