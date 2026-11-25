import type { KanbanEstimatedTurnaround } from "@/types/kanban";

/** US-4.2: the reviewer is the card's assigner, filled in for you, and is mentioned on the request. */
export type KanbanReviewRequestValues = { reviewerName: string; note: string };

/** E2-6 */
export type KanbanWaitingValues = {
  waitingOnWhat: string;
  waitingOnWho: string;
  contactedDate: string;
  followUpDate: string;
};

/** E2-7: Leadership is mentioned automatically. */
export type KanbanStuckValues = { blocker: string; attempts: string; helpNeeded: string };

/** E2-2 / E2-8: a deferral from Not Started also mentions Leadership. */
export type KanbanDeferralValues = {
  reason: string;
  estimatedTurnaround: KanbanEstimatedTurnaround;
  revisitDate: string;
};

/** E2-9: the closing summary. */
export type KanbanCompletionValues = { completedWork: string; outcome: string; notes: string };

/**
 * What a user must provide to move a card into each stage (Epic 2). Every variant either has a
 * required note or required fields that are combined into the note for the audit log.
 */
export type KanbanStageTransition =
  | { status: "not-started"; note: string }
  | { status: "working-on-it"; note: string }
  | ({ status: "needs-review" } & KanbanReviewRequestValues)
  | ({ status: "waiting" } & KanbanWaitingValues)
  | ({ status: "stuck" } & KanbanStuckValues)
  | ({ status: "deferred" } & KanbanDeferralValues)
  | ({ status: "done" } & KanbanCompletionValues);

export type KanbanStageTransitionStatus = KanbanStageTransition["status"];

export type KanbanDailyUpdateHealth = "on-track" | "at-risk" | "off-track";

/** E2-3: the update posted each workday for a card in Working on It. */
export type KanbanDailyUpdate = {
  progress: string;
  health: KanbanDailyUpdateHealth;
  nextSteps: string;
  issues: string;
};

export type KanbanWaitingDetails = {
  waitingOnWhat: string;
  waitingOnWho: string;
  contactedDate: string;
};

export type KanbanBlockerDetails = {
  blocker: string;
  attempts: string;
  helpNeeded: string;
};

export type KanbanCompletionSummary = {
  completedWork: string;
  outcome: string;
};
