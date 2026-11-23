import { getColumnTitle } from "@/lib/kanban";
import type { KanbanAttachment } from "@/types/attachment";
import type { KanbanAuditLogAction, KanbanAuditLogEntry } from "@/types/audit-log";
import type {
  KanbanStatus,
  KanbanTask,
  KanbanTaskPriority,
  KanbanTurnaroundUnit,
} from "@/types/kanban";
import type { KanbanStageTransition } from "@/types/kanban-stages";
import type { KanbanActivityRow, KanbanAttachmentRow, KanbanTaskRow } from "@/types/live/rows";

// Converts Supabase rows to the app's types and back (live mode). People are stored by id in
// the database and shown by name in the app.
// TODO: Move the app's cards from owner/reviewer names to ids, so two people with the same
// name can't be confused.

export function toKanbanAttachment(
  attachmentRow: KanbanAttachmentRow,
  nameByUserId: Map<string, string>,
  signedUrl: string,
): KanbanAttachment {
  return {
    id: attachmentRow.id,
    fileName: attachmentRow.file_name,
    sizeBytes: attachmentRow.size_bytes,
    mimeType: attachmentRow.mime_type,
    uploadedByName: attachmentRow.uploaded_by ? (nameByUserId.get(attachmentRow.uploaded_by) ?? "Someone") : "Someone",
    uploadedAt: attachmentRow.uploaded_at,
    activityId: attachmentRow.activity_id ?? undefined,
    url: signedUrl,
  };
}

export function toKanbanTask(
  taskRow: KanbanTaskRow,
  nameByUserId: Map<string, string>,
  attachments: KanbanAttachment[],
): KanbanTask {
  return {
    id: taskRow.id,
    businessId: taskRow.business_id,
    title: taskRow.title,
    description: taskRow.description,
    status: taskRow.status as KanbanStatus,
    ownerName: nameByUserId.get(taskRow.owner_id) ?? "Unknown",
    priority: taskRow.priority as KanbanTaskPriority,
    dueDate: taskRow.due_date,
    estimatedTurnaround:
      taskRow.estimated_turnaround_amount === null
        ? null
        : {
            amount: Number(taskRow.estimated_turnaround_amount),
            unit: taskRow.estimated_turnaround_unit as KanbanTurnaroundUnit,
          },
    latestNote: taskRow.latest_note,
    position: taskRow.position,
    attachments,
    deferralCount: taskRow.deferral_count,
    lastDailyUpdateAt: taskRow.last_daily_update_at ?? undefined,
    dailyUpdateMissedOn: taskRow.daily_update_missed_on ?? undefined,
    reviewerName: taskRow.reviewer_id ? nameByUserId.get(taskRow.reviewer_id) : undefined,
    waitingDetails:
      taskRow.waiting_on_what && taskRow.waiting_on_who && taskRow.contacted_date
        ? {
            waitingOnWhat: taskRow.waiting_on_what,
            waitingOnWho: taskRow.waiting_on_who,
            contactedDate: taskRow.contacted_date,
          }
        : undefined,
    followUpDate: taskRow.follow_up_date ?? undefined,
    blockerDetails:
      taskRow.blocker && taskRow.blocker_attempts && taskRow.help_needed
        ? {
            blocker: taskRow.blocker,
            attempts: taskRow.blocker_attempts,
            helpNeeded: taskRow.help_needed,
          }
        : undefined,
    revisitDate: taskRow.revisit_date ?? undefined,
    completionSummary:
      taskRow.completed_work && taskRow.outcome
        ? { completedWork: taskRow.completed_work, outcome: taskRow.outcome }
        : undefined,
  };
}

export function toKanbanAuditLogEntry(
  activityRow: KanbanActivityRow,
  nameByUserId: Map<string, string>,
  titleByTaskId: Map<string, string>,
): KanbanAuditLogEntry {
  const isMove = activityRow.action === "moved" && activityRow.from_status && activityRow.to_status;

  return {
    id: activityRow.id,
    taskId: activityRow.task_id,
    businessId: activityRow.business_id,
    taskTitle: titleByTaskId.get(activityRow.task_id) ?? "Card",
    action: activityRow.action as KanbanAuditLogAction,
    actorName: activityRow.actor_id ? (nameByUserId.get(activityRow.actor_id) ?? "Someone") : "System",
    occurredAt: activityRow.occurred_at,
    summary: isMove
      ? `${getColumnTitle(activityRow.from_status as KanbanStatus)} → ${getColumnTitle(activityRow.to_status as KanbanStatus)}`
      : activityRow.summary,
    note: activityRow.note,
    mentionedNames: activityRow.mentioned_user_ids
      .map((userId) => nameByUserId.get(userId))
      .filter((name): name is string => Boolean(name)),
  };
}

/** The camelCase details kanban_transition_task expects for each stage. */
export function toTransitionDetails(
  transition: KanbanStageTransition,
  userIdByName: Map<string, string>,
): Record<string, unknown> {
  switch (transition.status) {
    case "needs-review":
      return { reviewerId: userIdByName.get(transition.reviewerName) };
    case "waiting":
      return {
        waitingOnWhat: transition.waitingOnWhat,
        waitingOnWho: transition.waitingOnWho,
        contactedDate: transition.contactedDate,
        followUpDate: transition.followUpDate,
      };
    case "stuck":
      return {
        blocker: transition.blocker,
        attempts: transition.attempts,
        helpNeeded: transition.helpNeeded,
      };
    case "deferred":
      return {
        reason: transition.reason,
        turnaroundAmount: transition.estimatedTurnaround.amount,
        turnaroundUnit: transition.estimatedTurnaround.unit,
        revisitDate: transition.revisitDate,
      };
    case "done":
      return {
        completedWork: transition.completedWork,
        outcome: transition.outcome,
        notes: transition.notes,
      };
    default:
      return {};
  }
}

/** A position between a card's neighbors, so only the moved card needs saving. */
export function getPositionBetweenNeighbors(
  orderedTasks: Pick<KanbanTask, "id" | "position">[],
  taskId: string,
): number {
  const taskIndex = orderedTasks.findIndex((task) => task.id === taskId);
  const previousPosition = orderedTasks[taskIndex - 1]?.position;
  const nextPosition = orderedTasks[taskIndex + 1]?.position;

  if (previousPosition !== undefined && nextPosition !== undefined) {
    return (previousPosition + nextPosition) / 2;
  }
  if (previousPosition !== undefined) {
    return previousPosition + 1;
  }
  if (nextPosition !== undefined) {
    return nextPosition - 1;
  }
  return 0;
}
