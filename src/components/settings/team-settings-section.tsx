"use client";

import { useCurrentUser } from "@/components/current-user-provider";
import SettingsSection from "@/components/settings/settings-section";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/user-avatar";
import { KANBAN_ROLE_DEFINITIONS } from "@/constants/kanban-role-capabilities";

/**
 * Admins only: who is in the current business, their roles and who they report to (G3). Read-only
 * for now; the reporting chain is set with `yarn update-user <email> --reports-to <manager email>`.
 * TODO: Role changes, mention groups and invites, once those are built (see the settings roadmap).
 */
export default function TeamSettingsSection() {
  const { currentUser, teamMembers, currentBusiness } = useCurrentUser();

  if (currentUser.role !== "admin") {
    return null;
  }

  const businessMembers = teamMembers.filter((teamMember) => teamMember.businessIds.includes(currentBusiness.id));

  return (
    <SettingsSection
      title={`Team and access · ${currentBusiness.shortName}`}
      description="Everyone in this business and their role. Ask the development lead to add people or change roles."
    >
      <ul className="flex flex-col divide-y">
        {businessMembers.map((teamMember) => (
          <li key={teamMember.id} className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <UserAvatar name={teamMember.name} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{teamMember.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {[teamMember.jobTitle, teamMember.email].filter(Boolean).join(" · ") || "No job title"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Reports to {teamMembers.find((manager) => manager.id === teamMember.reportsToId)?.name ?? "nobody yet"}
              </span>
            </div>
            <Badge variant="secondary" title={KANBAN_ROLE_DEFINITIONS[teamMember.role].description}>
              {KANBAN_ROLE_DEFINITIONS[teamMember.role].label}
            </Badge>
          </li>
        ))}
      </ul>
    </SettingsSection>
  );
}
