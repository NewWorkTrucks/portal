import type { PortalRole } from "@/types/roles";

export type TeamMember = {
  id: string;
  name: string;
  jobTitle: string;
  role: PortalRole;
  /** What @mentions use; defaults to the name without spaces. */
  mentionHandle?: string;
  /** Businesses this person can see and work in (E4-2). */
  businessIds: string[];
};
