"use client";

import { CornerUpLeft, MoveRight } from "lucide-react";
import type { ReactNode } from "react";
import KanbanCompletionForm from "@/components/forms/kanban-completion-form";
import KanbanDailyUpdateForm from "@/components/forms/kanban-daily-update-form";
import KanbanDeferralForm from "@/components/forms/kanban-deferral-form";
import KanbanOperationNoteForm from "@/components/forms/kanban-operation-note-form";
import KanbanReviewRequestForm from "@/components/forms/kanban-review-request-form";
import KanbanStuckForm from "@/components/forms/kanban-stuck-form";
import KanbanWaitingForm from "@/components/forms/kanban-waiting-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getColumnTitle } from "@/lib/kanban";
import type { KanbanStageOperation } from "@/types/kanban";
import type { KanbanDailyUpdate, KanbanStageTransition } from "@/types/kanban-stages";
import type { Mentionable } from "@/types/mention";
import type { TeamMember } from "@/types/team";

type KanbanStageTransitionDialogProps = {
  /** Kept after the dialog closes so its content doesn't vanish during the exit animation. */
  operation: KanbanStageOperation | null;
  reviewerOptions: TeamMember[];
  mentionables: Mentionable[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirmTransition: (transition: KanbanStageTransition) => void | Promise<void>;
  onConfirmDailyUpdate: (dailyUpdate: KanbanDailyUpdate) => void | Promise<void>;
};

function TaskTitle({ title }: { title: string }) {
  return <strong className="font-semibold text-foreground">“{title}”</strong>;
}

/** Shows the required form for entering a stage (Epic 2), or the daily update form (E2-3). */
export default function KanbanStageTransitionDialog({
  operation,
  reviewerOptions,
  mentionables,
  isOpen,
  onOpenChange,
  onConfirmTransition,
  onConfirmDailyUpdate,
}: KanbanStageTransitionDialogProps) {
  function handleCancel() {
    onOpenChange(false);
  }

  function renderDialogBody(stageOperation: KanbanStageOperation): {
    title: string;
    description: ReactNode;
    form: ReactNode;
  } {
    const { task } = stageOperation;

    if (stageOperation.kind === "daily-update") {
      return {
        title: "Daily update",
        description: (
          <>
            Post today&rsquo;s update for <TaskTitle title={task.title} /> so anyone could pick it up.
          </>
        ),
        form: (
          <KanbanDailyUpdateForm
            mentionables={mentionables}
            onSubmit={onConfirmDailyUpdate}
            onCancel={handleCancel}
          />
        ),
      };
    }

    const { previousStatus, newStatus } = stageOperation;
    const isReviewDecision = previousStatus === "needs-review" && stageOperation.tasksBeforeMove === null;
    const moveDescription = (
      <>
        <TaskTitle title={task.title} />: {getColumnTitle(previousStatus)} → {getColumnTitle(newStatus)}.
      </>
    );

    switch (newStatus) {
      case "needs-review":
        return {
          title: "Request review",
          description: moveDescription,
          form: (
            <KanbanReviewRequestForm
              reviewerOptions={reviewerOptions}
              mentionables={mentionables}
              onSubmit={(values) => onConfirmTransition({ status: "needs-review", ...values })}
              onCancel={handleCancel}
            />
          ),
        };
      case "waiting":
        return {
          title: "Move to Waiting",
          description: moveDescription,
          form: (
            <KanbanWaitingForm
              mentionables={mentionables}
              onSubmit={(values) => onConfirmTransition({ status: "waiting", ...values })}
              onCancel={handleCancel}
            />
          ),
        };
      case "stuck":
        return {
          title: "Mark as Stuck?",
          description: moveDescription,
          form: (
            <KanbanStuckForm
              mentionables={mentionables}
              onSubmit={(values) => onConfirmTransition({ status: "stuck", ...values })}
              onCancel={handleCancel}
            />
          ),
        };
      case "deferred":
        return {
          title: previousStatus === "not-started" ? "Can't start this task" : "Defer task",
          description: moveDescription,
          form: (
            <KanbanDeferralForm
              initialTurnaround={task.estimatedTurnaround}
              isCantStartDeferral={previousStatus === "not-started"}
              previousDeferralCount={task.deferralCount}
              mentionables={mentionables}
              onSubmit={(values) => onConfirmTransition({ status: "deferred", ...values })}
              onCancel={handleCancel}
            />
          ),
        };
      case "done":
        return {
          title: isReviewDecision ? "Approve and close" : "Mark as Done",
          description: isReviewDecision ? (
            <>
              Approving <TaskTitle title={task.title} /> moves it to Done. Add the closing summary.
            </>
          ) : (
            moveDescription
          ),
          form: (
            <KanbanCompletionForm
              mentionables={mentionables}
              submitLabel={isReviewDecision ? "Approve" : "Mark as Done"}
              onSubmit={(values) => onConfirmTransition({ status: "done", ...values })}
              onCancel={handleCancel}
            />
          ),
        };
      case "not-started":
      case "working-on-it":
        return {
          title: isReviewDecision ? "Return for revisions" : `Move to ${getColumnTitle(newStatus)}`,
          description: isReviewDecision ? (
            <>
              <TaskTitle title={task.title} /> goes back to Working on It with your feedback.
            </>
          ) : (
            moveDescription
          ),
          form: (
            <KanbanOperationNoteForm
              noteLabel={isReviewDecision ? "What needs to change?" : "Why is it moving?"}
              notePlaceholder={
                isReviewDecision
                  ? "e.g. Add the carry-over section before this can be approved."
                  : "e.g. Started the checklist draft; first section done."
              }
              mentionables={mentionables}
              submitLabel={isReviewDecision ? "Return" : "Move task"}
              SubmitIcon={isReviewDecision ? CornerUpLeft : MoveRight}
              onSubmit={(note) => onConfirmTransition({ status: newStatus, note })}
              onCancel={handleCancel}
            />
          ),
        };
    }
  }

  const dialogBody = operation ? renderDialogBody(operation) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        {operation && dialogBody && (
          <>
            <DialogHeader>
              <DialogTitle>{dialogBody.title}</DialogTitle>
              <DialogDescription>{dialogBody.description}</DialogDescription>
            </DialogHeader>
            <div key={`${operation.kind}-${operation.task.id}`}>{dialogBody.form}</div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
