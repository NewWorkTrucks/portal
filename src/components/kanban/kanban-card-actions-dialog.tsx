"use client";

import {
  Archive,
  ArrowLeft,
  ArrowRightLeft,
  Check,
  CircleCheck,
  ClipboardCheck,
  CornerUpLeft,
  Lock,
  MessageSquarePlus,
  Pencil,
  TextCursorInput,
  UserRoundPen,
} from "lucide-react";
import { useState } from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import { useKanbanBoard } from "@/components/kanban/kanban-board-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserAvatar from "@/components/user-avatar";
import { KANBAN_COLUMNS } from "@/constants/kanban-columns";
import { KANBAN_ROLE_DEFINITIONS } from "@/constants/kanban-role-capabilities";
import { getColumnTitle } from "@/lib/kanban";
import { cn } from "@/lib/utils";
import type { KanbanCardActionsView, KanbanStatus, KanbanTask, KanbanTaskActions } from "@/types/kanban";
import type { TeamMember } from "@/types/team";

// At least 44 px tall, so every row is comfortable to tap.
const ACTION_ROW_CLASS_NAME =
  "h-auto min-h-11 w-full justify-start gap-3 rounded-lg px-3 py-2 text-left text-sm font-normal whitespace-normal [&_svg:not([class*='size-'])]:size-4";

type KanbanCardActionsDialogProps = {
  /** Kept after the dialog closes so its content doesn't vanish during the exit animation. */
  task: KanbanTask | null;
  teamMembers: TeamMember[];
  taskActions: KanbanTaskActions;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

/** The card menu opened by holding a card on touch screens, or from a list row's actions button. */
export default function KanbanCardActionsDialog({
  task,
  teamMembers,
  taskActions,
  isOpen,
  onOpenChange,
}: KanbanCardActionsDialogProps) {
  const { getTaskPermissions, getMoveDeniedReason } = useKanbanBoard();
  const { currentUser } = useCurrentUser();

  const [activeView, setActiveView] = useState<KanbanCardActionsView>("actions");

  function runAction(taskAction: (selectedTask: KanbanTask) => void) {
    if (!task) {
      return;
    }
    onOpenChange(false);
    taskAction(task);
  }

  function handleSelectStatus(newStatus: KanbanStatus) {
    runAction((selectedTask) => taskActions.onSelectStatus(selectedTask, newStatus));
  }

  function handleSelectOwner(ownerName: string) {
    runAction((selectedTask) => taskActions.onSelectOwner(selectedTask, ownerName));
  }

  function renderBackButton() {
    return (
      <Button variant="ghost" className={ACTION_ROW_CLASS_NAME} onClick={() => setActiveView("actions")}>
        <ArrowLeft aria-hidden />
        Back to actions
      </Button>
    );
  }

  function renderStatusView(selectedTask: KanbanTask) {
    return (
      <div className="flex flex-col gap-1">
        {renderBackButton()}
        {KANBAN_COLUMNS.map((column) => {
          const isCurrentStatus = column.status === selectedTask.status;
          const moveDeniedReason = isCurrentStatus ? null : getMoveDeniedReason(selectedTask, column.status);

          return (
            <Button
              key={column.status}
              variant="ghost"
              className={ACTION_ROW_CLASS_NAME}
              disabled={isCurrentStatus || moveDeniedReason !== null}
              aria-current={isCurrentStatus ? "true" : undefined}
              onClick={() => handleSelectStatus(column.status)}
            >
              <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", column.accentClassName)} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span>{column.title}</span>
                {moveDeniedReason && <span className="text-xs text-muted-foreground">{moveDeniedReason}</span>}
              </span>
              {isCurrentStatus && (
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Check aria-hidden className="size-3.5" />
                  Current
                </span>
              )}
            </Button>
          );
        })}
      </div>
    );
  }

  function renderOwnerView(selectedTask: KanbanTask) {
    return (
      <div className="flex flex-col gap-1">
        {renderBackButton()}
        {teamMembers.map((teamMember) => {
          const isCurrentOwner = teamMember.name === selectedTask.ownerName;

          return (
            <Button
              key={teamMember.id}
              variant="ghost"
              className={ACTION_ROW_CLASS_NAME}
              disabled={isCurrentOwner}
              aria-current={isCurrentOwner ? "true" : undefined}
              onClick={() => handleSelectOwner(teamMember.name)}
            >
              <UserAvatar name={teamMember.name} className="size-6" />
              <span className="min-w-0 flex-1">{teamMember.name}</span>
              {isCurrentOwner && (
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Check aria-hidden className="size-3.5" />
                  Owner
                </span>
              )}
            </Button>
          );
        })}
      </div>
    );
  }

  function renderActionsView(selectedTask: KanbanTask) {
    const taskPermissions = getTaskPermissions(selectedTask);
    const isAnyActionLimited =
      !taskPermissions.canMove ||
      !taskPermissions.canChangeOwner ||
      !taskPermissions.canEdit ||
      !taskPermissions.canRename ||
      !taskPermissions.canArchive;

    return (
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          className={ACTION_ROW_CLASS_NAME}
          disabled={!taskPermissions.canMove}
          onClick={() => setActiveView("status")}
        >
          <ArrowRightLeft aria-hidden />
          Change status
        </Button>
        <Button
          variant="ghost"
          className={ACTION_ROW_CLASS_NAME}
          disabled={!taskPermissions.canChangeOwner}
          onClick={() => setActiveView("owner")}
        >
          <UserRoundPen aria-hidden />
          Change ownership
        </Button>
        <Button
          variant="ghost"
          className={ACTION_ROW_CLASS_NAME}
          disabled={!taskPermissions.canEdit}
          onClick={() => runAction(taskActions.onClickEdit)}
        >
          <Pencil aria-hidden />
          Edit
        </Button>
        <Button
          variant="ghost"
          className={ACTION_ROW_CLASS_NAME}
          disabled={!taskPermissions.canRename}
          onClick={() => runAction(taskActions.onClickRename)}
        >
          <TextCursorInput aria-hidden />
          Rename
        </Button>
        <Button
          variant="ghost"
          className={ACTION_ROW_CLASS_NAME}
          disabled={!taskPermissions.canAddUpdate}
          onClick={() => runAction(taskActions.onClickAddUpdate)}
        >
          <MessageSquarePlus aria-hidden />
          Add update
        </Button>
        {selectedTask.status === "working-on-it" && (
          <Button
            variant="ghost"
            className={ACTION_ROW_CLASS_NAME}
            disabled={!taskPermissions.canPostDailyUpdate}
            onClick={() => runAction(taskActions.onClickDailyUpdate)}
          >
            <ClipboardCheck aria-hidden />
            Post daily update
          </Button>
        )}
        {selectedTask.status === "needs-review" && (
          <>
            <Button
              variant="ghost"
              className={ACTION_ROW_CLASS_NAME}
              disabled={!taskPermissions.canReview}
              onClick={() => runAction(taskActions.onClickApprove)}
            >
              <CircleCheck aria-hidden />
              Approve
            </Button>
            <Button
              variant="ghost"
              className={ACTION_ROW_CLASS_NAME}
              disabled={!taskPermissions.canReview}
              onClick={() => runAction(taskActions.onClickReturn)}
            >
              <CornerUpLeft aria-hidden />
              Return for revisions
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          className={cn(ACTION_ROW_CLASS_NAME, "text-destructive hover:text-destructive")}
          disabled={!taskPermissions.canArchive}
          onClick={() => runAction(taskActions.onClickArchive)}
        >
          <Archive aria-hidden />
          Archive
        </Button>
        {isAnyActionLimited && (
          <p className="flex items-start gap-1.5 px-3 pt-2 text-xs text-muted-foreground">
            <Lock aria-hidden className="mt-0.5 size-3 shrink-0" />
            Some actions are limited for your role ({KANBAN_ROLE_DEFINITIONS[currentUser.role].label}).
          </p>
        )}
      </div>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(isNowOpen) => {
        if (!isNowOpen) {
          setActiveView("actions");
        }
      }}
    >
      {task && (
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-sm">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-base">{task.title}</DialogTitle>
            <DialogDescription>
              {activeView === "status" && "Choose a new status."}
              {activeView === "owner" && "Choose a new owner."}
              {activeView === "actions" && `${getColumnTitle(task.status)}, owned by ${task.ownerName}`}
            </DialogDescription>
          </DialogHeader>
          {activeView === "actions" && renderActionsView(task)}
          {activeView === "status" && renderStatusView(task)}
          {activeView === "owner" && renderOwnerView(task)}
        </DialogContent>
      )}
    </Dialog>
  );
}
