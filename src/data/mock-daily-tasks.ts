import { addDaysToIsoDate, getCentralToday, getCurrentStreakWorkdays, isWorkday } from "@/lib/daily-tasks";
import type { DailyTaskHistory, DailyTaskHistoryDay, DailyTaskItem, DailyTasksToday } from "@/types/daily-tasks";

const MOCK_BUSINESS_ID = "business-nwt";
const MOCK_BEST_STREAK = 14;
const MOCK_STREAK_LOOKBACK_DAYS = 62;

// Days off marked in mock mode, kept in this browser tab only.
const mockDaysOff = new Set<string>();

function centralTimeOn(workday: string, hour: number, minute = 0): string {
  const [year, month, day] = workday.split("-").map(Number);
  // Central is UTC-6 in winter; close enough for sample data. Date.UTC rolls 29:00 into the next day.
  return new Date(Date.UTC(year, month - 1, day, hour + 6, minute)).toISOString();
}

function buildMockItems(workday: string, isToday: boolean): DailyTaskItem[] {
  const updateDeadline = centralTimeOn(workday, 18);
  const endOfDay = centralTimeOn(workday, 23, 59);
  return [
    { kind: "daily-update", businessId: MOCK_BUSINESS_ID, taskId: "task-4", title: "Map user-to-manager reporting lines", isDone: !isToday, doneAt: isToday ? null : centralTimeOn(workday, 16, 40), dueBy: updateDeadline, totalCount: null, doneCount: null },
    { kind: "review", businessId: MOCK_BUSINESS_ID, taskId: "task-5", title: "Weekly accomplishment report template", isDone: !isToday, doneAt: isToday ? null : centralTimeOn(workday, 11, 5), dueBy: endOfDay, totalCount: null, doneCount: null },
    { kind: "start-work", businessId: MOCK_BUSINESS_ID, taskId: "task-2", title: "Set up Google Chat webhook for alerts", isDone: !isToday, doneAt: isToday ? null : centralTimeOn(workday, 9, 30), dueBy: endOfDay, totalCount: null, doneCount: null },
    { kind: "catch-up", businessId: null, taskId: null, title: null, isDone: !isToday, doneAt: isToday ? null : centralTimeOn(workday, 10, 15), dueBy: endOfDay, totalCount: 3, doneCount: isToday ? 2 : 3 },
    { kind: "daily-update", businessId: MOCK_BUSINESS_ID, taskId: "task-3", title: "Build Kanban board layout", isDone: true, doneAt: centralTimeOn(workday, 10, 12), dueBy: updateDeadline, totalCount: null, doneCount: null },
  ];
}

/** Sample "today" for mock mode, shaped like kanban_get_my_daily_tasks. */
export function buildMockDailyTasks(now: Date = new Date()): DailyTasksToday {
  const today = getCentralToday(now);
  const isTodayWorkday = isWorkday(today);
  const isDayOff = mockDaysOff.has(today);
  const items = isTodayWorkday && !isDayOff ? buildMockItems(today, true) : [];
  return {
    workday: today,
    isWorkday: isTodayWorkday,
    isDayOff,
    items,
    totalCount: items.length,
    doneCount: items.filter((item) => item.isDone).length,
    ...getMockStreaks(today, isTodayWorkday && !isDayOff && items.every((item) => item.isDone)),
  };
}

/** The sample streak, counted from the sample days with the same rules the database uses. */
function getMockStreaks(today: string, isTodayComplete: boolean) {
  const earliestDay = addDaysToIsoDate(today, -MOCK_STREAK_LOOKBACK_DAYS);
  const daysByWorkday = new Map<string, DailyTaskHistoryDay>();
  for (let day = earliestDay; day < today; day = addDaysToIsoDate(day, 1)) {
    if (isWorkday(day)) {
      daysByWorkday.set(day, buildMockPastDay(day));
    }
  }
  const currentStreak = getCurrentStreakWorkdays(daysByWorkday, today, earliestDay).size + (isTodayComplete ? 1 : 0);
  return { currentStreak, bestStreak: Math.max(MOCK_BEST_STREAK, currentStreak) };
}

/** A repeatable outcome per past workday: mostly all done, sometimes partly done or nothing due. */
function buildMockPastDay(workday: string): DailyTaskHistoryDay {
  const daySeed = Number(workday.replaceAll("-", "")) % 9;
  const items = daySeed === 4 ? [] : buildMockItems(workday, false);
  if (daySeed === 7) {
    items[0] = { ...items[0], isDone: false, doneAt: null };
  }
  return {
    workday,
    isDayOff: mockDaysOff.has(workday),
    isClosed: true,
    totalCount: items.length,
    doneCount: items.filter((item) => item.isDone).length,
    items,
  };
}

/** Sample history for mock mode, shaped like kanban_get_my_daily_task_history. */
export function buildMockDailyTaskHistory(fromWorkday: string, toWorkday: string, now: Date = new Date()): DailyTaskHistory {
  const todaySummary = buildMockDailyTasks(now);
  const today = todaySummary.workday;
  const days: DailyTaskHistoryDay[] = [];

  for (let day = fromWorkday; day <= toWorkday; day = addDaysToIsoDate(day, 1)) {
    if (!isWorkday(day)) {
      continue;
    }
    if (day < today) {
      days.push(buildMockPastDay(day));
    } else if (day === today) {
      days.push({
        workday: today,
        isDayOff: todaySummary.isDayOff,
        isClosed: false,
        totalCount: todaySummary.totalCount,
        doneCount: todaySummary.doneCount,
        items: todaySummary.items,
      });
    } else if (mockDaysOff.has(day)) {
      days.push({ workday: day, isDayOff: true, isClosed: false, totalCount: null, doneCount: null, items: [] });
    }
  }

  return { today, days, currentStreak: todaySummary.currentStreak, bestStreak: todaySummary.bestStreak };
}

export function setMockDayOff(workday: string, isDayOff: boolean) {
  if (isDayOff) {
    mockDaysOff.add(workday);
  } else {
    mockDaysOff.delete(workday);
  }
}
