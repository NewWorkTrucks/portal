"use client";

import { CalendarDays, CircleCheck, Coffee, Flame, Moon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getMyDailyTasks } from "@/api/daily-tasks";
import { useCurrentUser } from "@/components/current-user-provider";
import DailyTaskItemRow from "@/components/daily-tasks/daily-task-item-row";
import DashboardLoadErrorPanel from "@/components/dashboard/dashboard-load-error";
import { useDataMode } from "@/components/data-mode-provider";
import { buttonVariants } from "@/components/ui/button";
import { buildMockDailyTasks } from "@/data/mock-daily-tasks";
import { describeDashboardLoadError } from "@/lib/dashboard";
import type { DailyTasksLoadState } from "@/types/daily-tasks";

const CLOCK_TICK_MS = 60_000;

/**
 * The signed-in person's Daily Tasks for today, built from their own cards. Each to-do completes
 * itself when the work happens on the board. The streak is private to this person.
 */
export default function DailyTasksPanel() {
  const { availableBusinesses } = useCurrentUser();
  const { dataMode } = useDataMode();

  const [loadState, setLoadState] = useState<DailyTasksLoadState>({ status: "loading" });
  // Read after mount: the clock can't be read while the page is prerendered.
  const [nowTimestamp, setNowTimestamp] = useState(0);
  // Bumped to load again: on Retry, and when the person comes back to the tab.
  const [reloadCount, setReloadCount] = useState(0);

  const businessNameById = useMemo(
    () => new Map(availableBusinesses.map((business) => [business.id, business.shortName])),
    [availableBusinesses],
  );
  const hasSeveralBusinesses = availableBusinesses.length > 1;

  function handleClickRetry() {
    setReloadCount((currentCount) => currentCount + 1);
  }

  useEffect(() => {
    let isCancelled = false;
    async function loadDailyTasks() {
      try {
        const dailyTasks = dataMode === "mock" ? buildMockDailyTasks() : await getMyDailyTasks();
        if (!isCancelled) {
          setLoadState({ status: "ready", dailyTasks });
        }
      } catch (loadError) {
        if (!isCancelled) {
          setLoadState({ status: "error", error: describeDashboardLoadError(loadError) });
        }
      }
    }
    void loadDailyTasks();
    return () => {
      isCancelled = true;
    };
  }, [dataMode, reloadCount]);

  useEffect(() => {
    // Coming back to the tab after posting an update shows it as done.
    function handleWindowFocus() {
      setNowTimestamp(Date.now());
      setReloadCount((currentCount) => currentCount + 1);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock is browser-only
    setNowTimestamp(Date.now());
    const clockTimer = setInterval(() => setNowTimestamp(Date.now()), CLOCK_TICK_MS);
    window.addEventListener("focus", handleWindowFocus);
    return () => {
      clearInterval(clockTimer);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  if (loadState.status === "loading") {
    return <p className="text-sm text-muted-foreground">Loading your Daily Tasks…</p>;
  }
  if (loadState.status === "error") {
    return <DashboardLoadErrorPanel error={loadState.error} onRetry={handleClickRetry} />;
  }

  const { dailyTasks } = loadState;
  const progressPercent = dailyTasks.totalCount > 0 ? (dailyTasks.doneCount / dailyTasks.totalCount) * 100 : 0;
  const isAllDone = dailyTasks.totalCount > 0 && dailyTasks.doneCount === dailyTasks.totalCount;

  return (
    <section
      aria-labelledby="daily-tasks-heading"
      className="flex min-w-0 flex-col gap-4 rounded-lg border bg-card p-4 text-card-foreground sm:p-5"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="daily-tasks-heading" className="font-heading text-base font-semibold">
            Daily Tasks
          </h2>
          <p className="text-sm text-muted-foreground">
            {dailyTasks.isWorkday && !dailyTasks.isDayOff && dailyTasks.totalCount > 0
              ? `${dailyTasks.doneCount} of ${dailyTasks.totalCount} done today. Each one ticks itself off when the work happens on the board.`
              : "Your to-dos for today, built from your cards."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
            title="Only you can see your streak."
          >
            <Flame aria-hidden className="size-3.5 text-primary" />
            {dailyTasks.currentStreak}-workday streak
            <span className="text-muted-foreground">· best {dailyTasks.bestStreak}</span>
          </span>
          <Link href="/dashboard/history" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <CalendarDays aria-hidden />
            View history
          </Link>
        </div>
      </header>

      {!dailyTasks.isWorkday ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Coffee aria-hidden className="size-4" />
          No Daily Tasks on weekends.
        </p>
      ) : dailyTasks.isDayOff ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Moon aria-hidden className="size-4" />
          Marked as a day off. Your streak is paused, not broken.
        </p>
      ) : dailyTasks.totalCount === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleCheck aria-hidden className="size-4 text-primary" />
          Nothing due today.
        </p>
      ) : (
        <>
          <div
            role="progressbar"
            aria-label="Daily Tasks done"
            aria-valuemin={0}
            aria-valuemax={dailyTasks.totalCount}
            aria-valuenow={dailyTasks.doneCount}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          {isAllDone && (
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <CircleCheck aria-hidden className="size-4" />
              All caught up for today.
            </p>
          )}
          <ul className="flex flex-col divide-y rounded-md border">
            {dailyTasks.items.map((item) => (
              <DailyTaskItemRow
                key={`${item.kind}-${item.taskId ?? "all"}`}
                item={item}
                businessName={hasSeveralBusinesses && item.businessId ? (businessNameById.get(item.businessId) ?? null) : null}
                isToday
                nowTimestamp={nowTimestamp}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
