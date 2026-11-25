"use client";

import { Moon, Sun } from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import DailyTaskItemRow from "@/components/daily-tasks/daily-task-item-row";
import { Button } from "@/components/ui/button";
import { DAY_OFF_DAYS_AHEAD, DAY_OFF_DAYS_BACK } from "@/constants/daily-tasks";
import { formatWorkday } from "@/lib/dashboard";
import { addDaysToIsoDate, getDailyTaskDayStatus } from "@/lib/daily-tasks";
import type { DailyTaskDayListProps } from "@/types/daily-tasks";

const DAY_SUMMARY_BY_STATUS = {
  "all-done": "Everything was done.",
  "partly-done": "Some to-dos weren't done, so this day ended the streak.",
  "in-progress": "Today is still going.",
  "nothing-due": "Nothing was due. Your streak carried on.",
  "day-off": "Day off. Your streak is paused, not broken.",
  "no-record": "No saved record for this day. It doesn't affect your streak.",
  upcoming: "An upcoming workday.",
} as const;

/** One workday's saved to-dos, with the option to mark it as a day off. */
export default function DailyTaskDayList({ workday, today, day, isSavingDayOff, onToggleDayOff }: DailyTaskDayListProps) {
  const { availableBusinesses } = useCurrentUser();

  const status = getDailyTaskDayStatus(workday, today, day);
  const isDayOff = day?.isDayOff ?? false;
  const canChangeDayOff =
    onToggleDayOff !== undefined &&
    workday >= addDaysToIsoDate(today, -DAY_OFF_DAYS_BACK) &&
    workday <= addDaysToIsoDate(today, DAY_OFF_DAYS_AHEAD);
  const hasSeveralBusinesses = availableBusinesses.length > 1;
  const items = day?.items ?? [];
  const countText = day?.totalCount && day.totalCount > 0 && !isDayOff ? ` ${day.doneCount} of ${day.totalCount} done.` : "";

  return (
    <section aria-labelledby="daily-task-day-heading" className="flex min-w-0 flex-col gap-3">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id="daily-task-day-heading" className="font-heading text-sm font-semibold">
            {formatWorkday(workday)}
            {workday === today && " (today)"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {DAY_SUMMARY_BY_STATUS[status]}
            {countText}
          </p>
        </div>
        {canChangeDayOff && (
          <Button variant="outline" size="sm" disabled={isSavingDayOff} onClick={() => onToggleDayOff?.(workday, !isDayOff)}>
            {isDayOff ? <Sun aria-hidden /> : <Moon aria-hidden />}
            {isDayOff ? "Remove day off" : "Mark as day off"}
          </Button>
        )}
      </header>

      {items.length > 0 && !isDayOff && (
        <ul className="flex flex-col divide-y rounded-md border">
          {items.map((item) => (
            <DailyTaskItemRow
              key={`${item.kind}-${item.taskId ?? "all"}`}
              item={item}
              businessName={
                hasSeveralBusinesses && item.businessId
                  ? (availableBusinesses.find((business) => business.id === item.businessId)?.shortName ?? null)
                  : null
              }
              isToday={workday === today}
              nowTimestamp={0}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
