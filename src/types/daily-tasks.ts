import type { RequestErrorDescription } from "@/types/request-error";

export type DailyTaskKind = "daily-update" | "start-work" | "follow-up" | "revisit" | "review" | "catch-up";

/** One to-do on a person's Daily Tasks, as kanban_get_my_daily_tasks returns it. */
export type DailyTaskItem = {
  kind: DailyTaskKind;
  /** Null for catch-up, which spans every business. */
  businessId: string | null;
  taskId: string | null;
  title: string | null;
  isDone: boolean;
  doneAt: string | null;
  /** 6 PM Central for daily updates, otherwise the end of the workday. */
  dueBy: string;
  /** Catch-up only: notifications to see, and how many are seen. */
  totalCount: number | null;
  doneCount: number | null;
};

export type DailyTaskStreaks = {
  currentStreak: number;
  bestStreak: number;
};

export type DailyTasksToday = DailyTaskStreaks & {
  /** YYYY-MM-DD, US Central. */
  workday: string;
  isWorkday: boolean;
  isDayOff: boolean;
  items: DailyTaskItem[];
  totalCount: number;
  doneCount: number;
};

export type DailyTaskHistoryDay = {
  workday: string;
  isDayOff: boolean;
  /** False for today and for days marked off ahead of time. */
  isClosed: boolean;
  totalCount: number | null;
  doneCount: number | null;
  items: DailyTaskItem[];
};

export type DailyTaskHistory = DailyTaskStreaks & {
  today: string;
  days: DailyTaskHistoryDay[];
};

/** How a workday looks on the history calendar. */
export type DailyTaskDayStatus =
  | "all-done"
  | "partly-done"
  | "in-progress"
  | "nothing-due"
  | "day-off"
  | "no-record"
  | "upcoming";

export type DailyTasksLoadState =
  | { status: "loading" }
  | { status: "ready"; dailyTasks: DailyTasksToday }
  | { status: "error"; error: RequestErrorDescription };

export type DailyTaskHistoryLoadState =
  | { status: "loading" }
  | { status: "ready"; history: DailyTaskHistory }
  | { status: "error"; error: RequestErrorDescription };

export type DailyTaskItemRowProps = {
  item: DailyTaskItem;
  /** Shown when the person belongs to more than one business. */
  businessName: string | null;
  /** Today's list shows time left; past days show only when each was done. */
  isToday: boolean;
  nowTimestamp: number;
};

export type DailyTaskCalendarProps = {
  /** YYYY-MM. */
  visibleMonth: string;
  today: string;
  daysByWorkday: ReadonlyMap<string, DailyTaskHistoryDay>;
  streakWorkdays: ReadonlySet<string>;
  selectedWorkday: string;
  onSelectWorkday: (workday: string) => void;
};

export type DailyTaskDayListProps = {
  workday: string;
  today: string;
  day: DailyTaskHistoryDay | undefined;
  isSavingDayOff: boolean;
  /** Left out when viewing someone else's history: only the person marks their own days off. */
  onToggleDayOff?: (workday: string, isDayOff: boolean) => void;
};

export type DashboardLoadErrorPanelProps = {
  error: RequestErrorDescription;
  onRetry: () => void;
};
