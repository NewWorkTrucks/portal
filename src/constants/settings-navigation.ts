import { AtSign, Bell, FileUp, KanbanSquare, Palette, UserRound, UsersRound } from "lucide-react";
import type { SettingsNavigationGroup } from "@/types/settings";

export const DEFAULT_SETTINGS_PATH = "/settings/profile";

export const SETTINGS_NAVIGATION_GROUPS: SettingsNavigationGroup[] = [
  {
    label: "Account",
    items: [
      { label: "Profile", href: "/settings/profile", Icon: UserRound },
      { label: "Notifications", href: "/settings/notifications", Icon: Bell },
    ],
  },
  {
    label: "Preferences",
    items: [{ label: "Appearance", href: "/settings/appearance", Icon: Palette }],
  },
  {
    label: "Kanban",
    items: [
      { label: "Board", href: "/settings/board", Icon: KanbanSquare },
      { label: "Import from Monday", href: "/settings/kanban-import", Icon: FileUp, isAdminOnly: true, isBeta: true },
    ],
  },
  {
    label: "Organization",
    items: [
      { label: "Team and access", href: "/settings/team", Icon: UsersRound, isAdminOnly: true },
      { label: "Mention groups", href: "/settings/mention-groups", Icon: AtSign, isAdminOnly: true },
    ],
  },
];
