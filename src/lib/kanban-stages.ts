import {
  KANBAN_DAILY_UPDATE_HEALTH_OPTIONS,
  KANBAN_ESCALATION_MENTION_HANDLE,
} from "@/constants/kanban-stages";
import { formatEstimatedTurnaround, formatKanbanDate } from "@/lib/kanban";
import type { KanbanStatus, KanbanTask } from "@/types/kanban";
import type { KanbanDailyUpdate, KanbanStageTransition } from "@/types/kanban-stages";

/** The audit-log note for a transition, built from the stage's required fields. */
export function describeStageTransition(transition: KanbanStageTransition): string {
  switch (transition.status) {
    case "not-started":
    case "working-on-it":
    case "needs-review":
      return transition.note;
    case "waiting":
      return [
        `Waiting on: ${transition.waitingOnWhat}`,
        `Who: ${transition.waitingOnWho}`,
        `Contacted: ${formatKanbanDate(transition.contactedDate)} · Follow up: ${formatKanbanDate(transition.followUpDate)}`,
      ].join("\n");
    case "stuck":
      return [
        `Blocker: ${transition.blocker}`,
        `Tried: ${transition.attempts}`,
        `Help needed: ${transition.helpNeeded}`,
      ].join("\n");
    case "deferred":
      return [
        `Reason: ${transition.reason}`,
        `New turnaround: ${formatEstimatedTurnaround(transition.estimatedTurnaround)} · Revisit: ${formatKanbanDate(transition.revisitDate)}`,
      ].join("\n");
    case "done":
      return [
        `Completed: ${transition.completedWork}`,
        `Outcome: ${transition.outcome}`,
        `Notes: ${transition.notes}`,
      ].join("\n");
  }
}

/**
 * The card fields after entering a stage: the new stage's details are set and the previous
 * stage's details are cleared, so a card never shows a stale follow-up or blocker.
 */
export function getStageTaskChanges(
  task: KanbanTask,
  transition: KanbanStageTransition,
): Partial<KanbanTask> {
  const clearedStageFields: Partial<KanbanTask> = {
    reviewerName: undefined,
    waitingDetails: undefined,
    followUpDate: undefined,
    blockerDetails: undefined,
    revisitDate: undefined,
    completionSummary: undefined,
  };
  const latestNote = describeStageTransition(transition);

  switch (transition.status) {
    case "not-started":
    case "working-on-it":
      return { ...clearedStageFields, latestNote };
    case "needs-review":
      return { ...clearedStageFields, latestNote, reviewerName: transition.reviewerName };
    case "waiting":
      return {
        ...clearedStageFields,
        latestNote,
        waitingDetails: {
          waitingOnWhat: transition.waitingOnWhat,
          waitingOnWho: transition.waitingOnWho,
          contactedDate: transition.contactedDate,
        },
        followUpDate: transition.followUpDate,
      };
    case "stuck":
      return {
        ...clearedStageFields,
        latestNote,
        blockerDetails: {
          blocker: transition.blocker,
          attempts: transition.attempts,
          helpNeeded: transition.helpNeeded,
        },
      };
    case "deferred":
      return {
        ...clearedStageFields,
        latestNote,
        estimatedTurnaround: transition.estimatedTurnaround,
        revisitDate: transition.revisitDate,
        deferralCount: task.deferralCount + 1,
      };
    case "done":
      return {
        ...clearedStageFields,
        latestNote,
        completionSummary: { completedWork: transition.completedWork, outcome: transition.outcome },
      };
  }
}

/** Mention handles a transition notifies automatically, on top of any @mentions in the note. */
export function getStageAutoMentionHandles(
  transition: KanbanStageTransition,
  previousStatus: KanbanStatus,
): string[] {
  switch (transition.status) {
    case "needs-review":
      return [transition.reviewerName.replace(/\s+/g, "")];
    case "stuck":
      return [KANBAN_ESCALATION_MENTION_HANDLE];
    case "deferred":
      return previousStatus === "not-started" ? [KANBAN_ESCALATION_MENTION_HANDLE] : [];
    default:
      return [];
  }
}

export function describeDailyUpdate(dailyUpdate: KanbanDailyUpdate): string {
  const healthLabel =
    KANBAN_DAILY_UPDATE_HEALTH_OPTIONS.find((option) => option.value === dailyUpdate.health)
      ?.label ?? dailyUpdate.health;

  return [
    `Progress (${healthLabel}): ${dailyUpdate.progress}`,
    `Next: ${dailyUpdate.nextSteps}`,
    `Issues: ${dailyUpdate.issues || "None"}`,
  ].join("\n");
}

export function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }
  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
