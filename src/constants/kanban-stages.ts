import type { KanbanStatus } from "@/types/kanban";
import type { KanbanDailyUpdateHealth } from "@/types/kanban-stages";

/** Stages a new card may start in. Every other stage has required fields, so it is entered by moving the card (Epic 2). */
export const KANBAN_CREATABLE_STATUSES: readonly KanbanStatus[] = ["not-started", "working-on-it"];

export const KANBAN_DAILY_UPDATE_HEALTH_OPTIONS: {
  value: KanbanDailyUpdateHealth;
  label: string;
}[] = [
  { value: "on-track", label: "On track" },
  { value: "at-risk", label: "At risk" },
  { value: "off-track", label: "Off track" },
];

/** The mention group notified automatically for Stuck cards and deferrals from Not Started (E2-2, E2-7). */
export const KANBAN_ESCALATION_MENTION_HANDLE = "Leadership";
