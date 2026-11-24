import { AtSign, CalendarClock, ClipboardCheck, Eye, Play, RotateCcw, type LucideIcon } from "lucide-react";
import type { DailyTaskKind } from "@/types/daily-tasks";

export const DAILY_TASK_KIND_ICONS: Record<DailyTaskKind, LucideIcon> = {
  "daily-update": ClipboardCheck,
  "start-work": Play,
  "follow-up": CalendarClock,
  revisit: RotateCcw,
  review: Eye,
  "catch-up": AtSign,
};

/** Days off can be marked this far back and ahead, matching kanban_set_day_off. */
export const DAY_OFF_DAYS_BACK = 30;
export const DAY_OFF_DAYS_AHEAD = 60;

/** How far back the history calendar goes. */
export const DAILY_TASK_HISTORY_MONTHS = 12;
