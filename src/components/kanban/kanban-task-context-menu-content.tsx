"use client";

import {
  Archive,
  CircleCheck,
  ClipboardCheck,
  CornerUpLeft,
  Lock,
  MessageSquarePlus,
  Pencil,
  TextCursorInput,
  UserRoundPen,
} from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { useKanbanBoard } from "@/components/kanban/kanban-board-provider";
import {
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import UserAvatar from "@/components/user-avatar";
import { KANBAN_ROLE_DEFINITIONS } from "@/constants/kanban-role-capabilities";
import type { KanbanTaskMenuProps } from "@/types/kanban";

/** The right-click menu for a task, shared by board cards and list rows. */
export default function KanbanTaskContextMenuContent({ task, taskActions }: KanbanTaskMenuProps) {
  const { getTaskPermissions, assignableTeamMembers } = useKanbanBoard();
  const { currentUser } = useCurrentUser();

  const taskPermissions = getTaskPermissions(task);
  const isAnyActionLimited =
    !taskPermissions.canChangeOwner ||
    !taskPermissions.canEdit ||
    !taskPermissions.canRename ||
    !taskPermissions.canArchive;

  return (
    <ContextMenuContent className="w-56">
      <ContextMenuGroup>
        <ContextMenuLabel className="flex items-center gap-2 text-foreground">
          <UserAvatar name={task.ownerName} size="default" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{task.ownerName}</span>
            <span className="text-xs text-muted-foreground">Owner</span>
          </span>
        </ContextMenuLabel>
        <ContextMenuSub>
          <ContextMenuSubTrigger disabled={!taskPermissions.canChangeOwner}>
            <UserRoundPen aria-hidden />
            Change ownership
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuRadioGroup
              value={task.ownerName}
              onValueChange={(ownerName: string) => taskActions.onSelectOwner(task, ownerName)}
            >
              {assignableTeamMembers.map((teamMember) => (
                <ContextMenuRadioItem key={teamMember.id} value={teamMember.name}>
                  <UserAvatar name={teamMember.name} className="size-5" />
                  {teamMember.name}
                </ContextMenuRadioItem>
              ))}
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuGroup>

      <ContextMenuSeparator />

      <ContextMenuGroup>
        <ContextMenuItem
          disabled={!taskPermissions.canEdit}
          onClick={() => taskActions.onClickEdit(task)}
        >
          <Pencil aria-hidden />
          Edit
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!taskPermissions.canRename}
          onClick={() => taskActions.onClickRename(task)}
        >
          <TextCursorInput aria-hidden />
          Rename
        </ContextMenuItem>
      </ContextMenuGroup>

      <ContextMenuSeparator />
      <ContextMenuGroup>
        <ContextMenuItem
          disabled={!taskPermissions.canAddUpdate}
          onClick={() => taskActions.onClickAddUpdate(task)}
        >
          <MessageSquarePlus aria-hidden />
          Add update
        </ContextMenuItem>
        {task.status === "working-on-it" && (
          <ContextMenuItem
            disabled={!taskPermissions.canPostDailyUpdate}
            onClick={() => taskActions.onClickDailyUpdate(task)}
          >
            <ClipboardCheck aria-hidden />
            Post daily update
          </ContextMenuItem>
        )}
        {task.status === "needs-review" && (
          <>
            <ContextMenuItem
              disabled={!taskPermissions.canReview}
              onClick={() => taskActions.onClickApprove(task)}
            >
              <CircleCheck aria-hidden />
              Approve
            </ContextMenuItem>
            <ContextMenuItem
              disabled={!taskPermissions.canReview}
              onClick={() => taskActions.onClickReturn(task)}
            >
              <CornerUpLeft aria-hidden />
              Return for revisions
            </ContextMenuItem>
          </>
        )}
      </ContextMenuGroup>

      <ContextMenuSeparator />

      <ContextMenuItem
        variant="destructive"
        disabled={!taskPermissions.canArchive}
        onClick={() => taskActions.onClickArchive(task)}
      >
        <Archive aria-hidden />
        Archive
      </ContextMenuItem>

      {isAnyActionLimited && (
        <>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuLabel className="flex items-start gap-1.5">
              <Lock aria-hidden className="mt-0.5 size-3 shrink-0" />
              Some actions are limited for your role ({KANBAN_ROLE_DEFINITIONS[currentUser.role].label}).
            </ContextMenuLabel>
          </ContextMenuGroup>
        </>
      )}
    </ContextMenuContent>
  );
}
