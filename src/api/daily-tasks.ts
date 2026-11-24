import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { DailyTaskHistory, DailyTasksToday } from "@/types/daily-tasks";

function requireSupabase() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Live mode isn't set up.");
  }
  return supabase;
}

/** The signed-in person's Daily Tasks for today and their private streaks (live mode). */
export async function getMyDailyTasks(): Promise<DailyTasksToday> {
  const { data, error } = await requireSupabase().rpc("kanban_get_my_daily_tasks");
  if (error) {
    throw error;
  }
  return data as DailyTasksToday;
}

/** The signed-in person's saved Daily Tasks between two workdays, at most 93 days apart (live mode). */
export async function getMyDailyTaskHistory(fromWorkday: string, toWorkday: string): Promise<DailyTaskHistory> {
  const { data, error } = await requireSupabase().rpc("kanban_get_my_daily_task_history", {
    p_from: fromWorkday,
    p_to: toWorkday,
  });
  if (error) {
    throw error;
  }
  return data as DailyTaskHistory;
}

/** Marks or unmarks one of the signed-in person's workdays as a day off (live mode). */
export async function setMyDayOff(workday: string, isDayOff: boolean): Promise<void> {
  const { error } = await requireSupabase().rpc("kanban_set_day_off", {
    p_workday: workday,
    p_is_day_off: isDayOff,
  });
  if (error) {
    throw error;
  }
}
