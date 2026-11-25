/** How often a card repeats (US-1.3). Mirrors kanban_tasks.recurrence in the database. */
export type KanbanRecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

/** Monthly repeats follow the date (the 15th) or the weekday (the second Tuesday). */
export type KanbanRecurrenceMonthlyBy = "day-of-month" | "weekday-of-month";

/** ISO weekday: Monday is 1, Sunday is 7. */
export type KanbanIsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type KanbanRecurrenceRule = {
  frequency: KanbanRecurrenceFrequency;
  /** Every N days, weeks, months or years, 1 to 99. */
  interval: number;
  /** Weekly only: at least one. */
  weekdays?: KanbanIsoWeekday[];
  /** Monthly only. */
  monthlyBy?: KanbanRecurrenceMonthlyBy;
  /** YYYY-MM-DD, US Central. Intervals count from here. */
  startDate: string;
  /** YYYY-MM-DD, last day it may come back. */
  endsOn?: string | null;
  /** Stop after this many times, counting the current round. */
  endsAfterCount?: number | null;
};

export type KanbanRecurrence = {
  rule: KanbanRecurrenceRule;
  /** HH:MM, 24-hour, US Central: when the card comes back. */
  time: string;
  /** When it next comes back; null once the repeat has ended. */
  nextOccurrenceAt: string | null;
};

/** The quick choices, like Google Calendar's repeat menu. */
export type KanbanRecurrencePresetId =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "weekdays"
  | "custom";

export type KanbanRecurrencePreset = {
  id: KanbanRecurrencePresetId;
  label: string;
};

export type KanbanRecurrenceEndsKind = "never" | "on-date" | "after-count";

/** What the repeat form submits: a rule and time, or null to stop repeating. */
export type KanbanRecurrenceFormValues = {
  rule: KanbanRecurrenceRule;
  time: string;
} | null;

export type KanbanRecurrenceFormProps = {
  /** The card's current repeat, or null if it doesn't repeat. */
  initialRecurrence: KanbanRecurrence | null;
  /** Today, YYYY-MM-DD US Central: the start date for a new repeat. */
  today: string;
  onSubmit: (values: KanbanRecurrenceFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

export type KanbanRecurrenceDialogProps = {
  taskTitle: string;
  initialRecurrence: KanbanRecurrence | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: KanbanRecurrenceFormValues) => void | Promise<void>;
};
