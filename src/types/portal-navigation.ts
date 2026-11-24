import type { LucideIcon } from "lucide-react";

export type PortalNavigationItem = {
  label: string;
  href: string;
  Icon: LucideIcon;
};

export type PortalNavigationGroup = {
  label: string;
  items: PortalNavigationItem[];
};

export type PortalNavigationLinksProps = {
  /** Icons only, with the label kept for screen readers and shown on hover. */
  isCollapsed?: boolean;
  /** Called after a link is picked, so a drawer can close itself. */
  onSelectLink?: () => void;
};
