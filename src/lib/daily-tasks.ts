import type { DailyTaskDayStatus, DailyTaskHistoryDay, DailyTaskItem } from "@/types/daily-tasks";

const DAY_MS = 24 * 60 * 60 * 1000;
const WORKDAYS_PER_WEEK = 5;

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const DONE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Chicago",
  timeZoneName: "short",
});

/** Today's date in US Central time, as YYYY-MM-DD. */
export function getCentralToday(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}

function toUtcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

export function addDaysToIsoDate(isoDate: string, dayCount: number): string {
  return new Date(toUtcDate(isoDate).getTime() + dayCount * DAY_MS).toISOString().slice(0, 10);
}

export function isWorkday(isoDate: string): boolean {
  const weekday = toUtcDate(isoDate).getUTCDay();
  return weekday !== 0 && weekday !== 6;
}

/** The workday before `isoDate`. */
export function getPreviousWorkday(isoDate: string): string {
  let previousDay = addDaysToIsoDate(isoDate, -1);
  while (!isWorkday(previousDay)) {
    previousDay = addDaysToIsoDate(previousDay, -1);
  }
  return previousDay;
}

/** "2026-11" for a YYYY-MM-DD date. */
export function getYearMonth(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function shiftYearMonth(yearMonth: string, monthCount: number): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + monthCount, 1));
  return shifted.toISOString().slice(0, 7);
}

export function formatYearMonth(yearMonth: string): string {
  return MONTH_LABEL_FORMATTER.format(toUtcDate(`${yearMonth}-01`));
}

/** First and last day of a month, as YYYY-MM-DD. */
export function getMonthRange(yearMonth: string): { firstDay: string; lastDay: string } {
  const firstDay = `${yearMonth}-01`;
  const lastDay = addDaysToIsoDate(`${shiftYearMonth(yearMonth, 1)}-01`, -1);
  return { firstDay, lastDay };
}

/** The month's workdays laid out Monday to Friday, one array per week; null fills the gaps. */
export function getMonthWorkdayWeeks(yearMonth: string): (string | null)[][] {
  const { firstDay, lastDay } = getMonthRange(yearMonth);
  const weeks: (string | null)[][] = [];
  let currentWeek: (string | null)[] = [];

  for (let day = firstDay; day <= lastDay; day = addDaysToIsoDate(day, 1)) {
    if (!isWorkday(day)) {
      continue;
    }
    const weekdayIndex = toUtcDate(day).getUTCDay() - 1;
    if (currentWeek.length === 0) {
      currentWeek = Array.from({ length: weekdayIndex }, () => null);
    }
    currentWeek.push(day);
    if (currentWeek.length === WORKDAYS_PER_WEEK) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push([...currentWeek, ...Array.from({ length: WORKDAYS_PER_WEEK - currentWeek.length }, () => null)]);
  }
  return weeks;
}

/** How a workday reads on the history calendar. */
export function getDailyTaskDayStatus(
  workday: string,
  today: string,
  day: DailyTaskHistoryDay | undefined,
): DailyTaskDayStatus {
  if (day?.isDayOff) {
    return "day-off";
  }
  if (workday > today) {
    return "upcoming";
  }
  if (!day || day.totalCount === null) {
    return "no-record";
  }
  if (day.totalCount === 0) {
    return "nothing-due";
  }
  if (day.doneCount === day.totalCount) {
    return "all-done";
  }
  return workday === today ? "in-progress" : "partly-done";
}

/**
 * The workdays in the current streak, for highlighting only (the database owns the count).
 * Walks back from today: all-done days join, nothing-due days, days off and missing days are
 * skipped, and the first partly done day ends it.
 */
export function getCurrentStreakWorkdays(
  daysByWorkday: ReadonlyMap<string, DailyTaskHistoryDay>,
  today: string,
  earliestWorkday: string,
): Set<string> {
  const streakWorkdays = new Set<string>();
  const todayStatus = getDailyTaskDayStatus(today, today, daysByWorkday.get(today));
  if (todayStatus === "all-done") {
    streakWorkdays.add(today);
  }
  for (let workday = getPreviousWorkday(today); workday >= earliestWorkday; workday = getPreviousWorkday(workday)) {
    const status = getDailyTaskDayStatus(workday, today, daysByWorkday.get(workday));
    if (status === "partly-done") {
      break;
    }
    if (status === "all-done") {
      streakWorkdays.add(workday);
    }
  }
  return streakWorkdays;
}

/**
 * The to-do written around its card, e.g. "Post today's update on Vendor checklist", or
 * "Post the daily update on Vendor checklist" for a past day.
 */
export function describeDailyTask(item: DailyTaskItem, isToday: boolean): string {
  const cardTitle = item.title ?? "a card";
  switch (item.kind) {
    case "daily-update":
      return isToday ? `Post today's update on ${cardTitle}` : `Post the daily update on ${cardTitle}`;
    case "start-work":
      return `Start or explain ${cardTitle}`;
    case "follow-up":
      return `Follow up on ${cardTitle}`;
    case "revisit":
      return `Revisit ${cardTitle}`;
    case "review":
      return `Review ${cardTitle}`;
    case "catch-up":
      return "Catch up on updates that mention you";
  }
}

/** "3 h left", "45 min left" or "Past 6 PM". */
export function formatTimeLeft(dueByIso: string, nowTimestamp: number): string {
  const minutesLeft = Math.floor((new Date(dueByIso).getTime() - nowTimestamp) / 60000);
  if (minutesLeft <= 0) {
    return "Deadline passed";
  }
  if (minutesLeft < 60) {
    return `${minutesLeft} min left`;
  }
  return `${Math.floor(minutesLeft / 60)} h left`;
}

export function formatDoneTime(doneAtIso: string): string {
  return DONE_TIME_FORMATTER.format(new Date(doneAtIso));
}
