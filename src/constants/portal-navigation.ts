import { KanbanSquare, LayoutDashboard } from "lucide-react";
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
