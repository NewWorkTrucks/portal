"use client";

import { useCurrentUser } from "@/components/current-user-provider";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/user-avatar";
import { KANBAN_ROLE_DEFINITIONS } from "@/constants/kanban-role-capabilities";

export default function UserProfile() {
  const { currentUser, signedInUser, isSimulatingUser } = useCurrentUser();

  return (
    <div data-tour="profile" className="flex min-w-0 items-center gap-2">
      <UserAvatar name={currentUser.name} size="default" />
      {isSimulatingUser && (
        <Badge className="bg-amber-200 text-amber-950 sm:hidden dark:bg-amber-400/30 dark:text-amber-100">
          Viewing as
        </Badge>
      )}
      <span className="sr-only sm:hidden">{currentUser.name}</span>
      <div className="hidden min-w-0 flex-col leading-tight sm:flex">
        {isSimulatingUser && (
          <Badge className="mb-0.5 bg-amber-200 text-amber-950 dark:bg-amber-400/30 dark:text-amber-100">
            Viewing as
          </Badge>
        )}
        <span className="truncate text-sm font-medium">{currentUser.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {KANBAN_ROLE_DEFINITIONS[currentUser.role].label}
          {" · "}
          {isSimulatingUser ? `Signed in as ${signedInUser.name}` : currentUser.jobTitle}
        </span>
      </div>
    </div>
  );
}
