import { CalendarX2, ClockAlert, Eye, Hourglass, OctagonAlert, type LucideIcon } from "lucide-react";
import type { DashboardAttentionReason } from "@/types/dashboard";

/** Shown in this order, most urgent first. */
export const DASHBOARD_ATTENTION_REASON_ORDER: readonly DashboardAttentionReason[] = [
  "stuck",
  "review-over-limit",
  "missed-update",
  "overdue",
  "not-started-over-limit",
];

export const DASHBOARD_ATTENTION_REASON_DISPLAY: Record<
  DashboardAttentionReason,
  { label: string; Icon: LucideIcon; isProvisional: boolean }
> = {
  stuck: { label: "Stuck", Icon: OctagonAlert, isProvisional: false },
  "review-over-limit": { label: "In review too long", Icon: Eye, isProvisional: true },
  "missed-update": { label: "Missed daily update", Icon: ClockAlert, isProvisional: false },
  overdue: { label: "Past due date", Icon: CalendarX2, isProvisional: false },
  "not-started-over-limit": { label: "Not started in time", Icon: Hourglass, isProvisional: true },
};
