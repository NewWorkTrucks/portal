"use client";

import { UserRoundSearch, Undo2 } from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/user-avatar";
import { KANBAN_ROLE_DEFINITIONS } from "@/constants/kanban-role-capabilities";

/** Development-only menu for viewing the app as another team member. */
export default function UserSimulationMenu() {
  const { teamMembers, signedInUser, currentUser, isSimulatingUser, simulateUser } =
    useCurrentUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <UserRoundSearch aria-hidden />
        <span className="hidden sm:inline">Switch user</span>
        <span className="sr-only sm:hidden">Switch user</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>View the app as (development only)</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={currentUser.id}
            onValueChange={(teamMemberId: string) => simulateUser(teamMemberId)}
          >
            {teamMembers.map((teamMember) => (
              <DropdownMenuRadioItem key={teamMember.id} value={teamMember.id} closeOnClick>
                <UserAvatar name={teamMember.name} className="size-5" />
                <span className="flex min-w-0 flex-col">
                  <span>
                    {teamMember.name}
                    {teamMember.id === signedInUser.id && " (you)"}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {KANBAN_ROLE_DEFINITIONS[teamMember.role].label} · {teamMember.jobTitle}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>

        {isSimulatingUser && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => simulateUser(null)}>
              <Undo2 aria-hidden />
              Stop viewing as {currentUser.name}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
