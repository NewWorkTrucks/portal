import type { PortalRole } from "@/types/roles";

export type TeamMember = {
  id: string;
  name: string;
  jobTitle: string;
  role: PortalRole;
};
