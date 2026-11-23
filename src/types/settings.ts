import type { LucideIcon } from "lucide-react";

export type SettingsNavigationItem = {
  label: string;
  href: string;
  Icon: LucideIcon;
  isAdminOnly?: boolean;
  isBeta?: boolean;
};

export type SettingsNavigationGroup = {
  label: string;
  items: SettingsNavigationItem[];
};
