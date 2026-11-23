export type KanbanAuditLogAction =
  | "created"
  | "edited"
  | "renamed"
  | "moved"
  | "owner-changed"
  | "archived"
  | "daily-update"
  | "update"
  | "comment"
  | "attached"
  | "attachment-removed";

/** One immutable entry in a card's activity log (E1-5). Entries are only ever appended. */
export type KanbanAuditLogEntry = {
  readonly id: string;
  readonly taskId: string;
  readonly businessId: string;
  readonly taskTitle: string;
  readonly action: KanbanAuditLogAction;
  readonly actorName: string;
  /** Set when the action was taken while "viewing as" actorName (development only). */
  readonly simulatedByName?: string;
  readonly occurredAt: string;
  readonly summary: string;
  /** The required note the user gave for this change. */
  readonly note: string;
  /** Everyone the note's @mentions notify, after group expansion and auto-include rules. */
  readonly mentionedNames: readonly string[];
  /** The update this entry replies to, when it is a comment. */
  readonly parentActivityId?: string;
};
