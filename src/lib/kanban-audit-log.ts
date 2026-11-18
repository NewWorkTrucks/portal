import { KANBAN_TASK_PRIORITY_OPTIONS } from "@/constants/kanban-task-priorities";
import { formatEstimatedTurnaround, formatKanbanDate } from "@/lib/kanban";
import type { KanbanAuditLogAction, KanbanAuditLogEntry } from "@/types/audit-log";
import type { KanbanTask, KanbanTaskEditableFields } from "@/types/kanban";

// TODO: Confirm the reporting time zone (PH or US Central is an open question). Shows viewer-local time for now.
const AUDIT_LOG_TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "medium",
});

export function formatAuditLogTimestamp(isoTimestamp: string): string {
  return AUDIT_LOG_TIMESTAMP_FORMATTER.format(new Date(isoTimestamp));
}

const EDITABLE_FIELD_LABELS: Record<keyof KanbanTaskEditableFields, string> = {
  title: "title",
  description: "description",
  ownerName: "owner",
  priority: "priority",
  dueDate: "due date",
  estimatedTurnaround: "turnaround",
};

function formatFieldValue(
  fieldName: keyof KanbanTaskEditableFields,
  editableFields: KanbanTaskEditableFields,
): string {
  switch (fieldName) {
    case "priority":
      return (
        KANBAN_TASK_PRIORITY_OPTIONS.find((option) => option.value === editableFields.priority)
          ?.label ?? editableFields.priority
      );
    case "dueDate":
      return formatKanbanDate(editableFields.dueDate);
    case "estimatedTurnaround":
      return formatEstimatedTurnaround(editableFields.estimatedTurnaround);
    default:
      return editableFields[fieldName] || "(empty)";
  }
}

/** Describes which fields an edit changed, e.g. "priority: Medium → High; due date: Nov 24 → Nov 26". */
export function describeTaskEdits(task: KanbanTask, editedFields: KanbanTaskEditableFields): string {
  const changedFieldDescriptions = (
    Object.keys(EDITABLE_FIELD_LABELS) as (keyof KanbanTaskEditableFields)[]
  )
    .filter(
      (fieldName) => formatFieldValue(fieldName, task) !== formatFieldValue(fieldName, editedFields),
    )
    .map((fieldName) =>
      fieldName === "description"
        ? "description updated"
        : `${EDITABLE_FIELD_LABELS[fieldName]}: ${formatFieldValue(fieldName, task)} → ${formatFieldValue(fieldName, editedFields)}`,
    );

  return changedFieldDescriptions.length > 0 ? changedFieldDescriptions.join("; ") : "No field changes";
}

export function createAuditLogEntry(
  task: Pick<KanbanTask, "id" | "title" | "businessId">,
  action: KanbanAuditLogAction,
  actor: { actorName: string; simulatedByName?: string },
  summary: string,
  note: string,
  mentionedNames: readonly string[],
): KanbanAuditLogEntry {
  return Object.freeze({
    id: crypto.randomUUID(),
    taskId: task.id,
    businessId: task.businessId,
    taskTitle: task.title,
    action,
    actorName: actor.actorName,
    simulatedByName: actor.simulatedByName,
    occurredAt: new Date().toISOString(),
    summary,
    note,
    mentionedNames: Object.freeze([...mentionedNames]),
  });
}
