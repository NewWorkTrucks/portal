"use client";

import { Check, CircleDashed, ClockAlert, Minus, Moon } from "lucide-react";
import { type KeyboardEvent, useRef } from "react";
import { formatWorkday } from "@/lib/dashboard";
import { countMissedDailyUpdates, getDailyTaskDayStatus, getMonthWorkdayWeeks } from "@/lib/daily-tasks";
import { cn } from "@/lib/utils";
import type { DailyTaskCalendarProps, DailyTaskDayStatus } from "@/types/daily-tasks";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const DAY_STATUS_DISPLAY: Record<DailyTaskDayStatus, { label: string; cellClassName: string }> = {
  "all-done": { label: "All done", cellClassName: "bg-primary/20 text-foreground" },
  "partly-done": { label: "Partly done", cellClassName: "bg-amber-500/20 text-foreground" },
  "in-progress": { label: "In progress", cellClassName: "bg-muted text-foreground" },
  "nothing-due": { label: "Nothing due", cellClassName: "bg-muted/50 text-muted-foreground" },
  "day-off": { label: "Day off", cellClassName: "border border-dashed border-muted-foreground/60 text-muted-foreground" },
  "no-record": { label: "No record", cellClassName: "text-muted-foreground" },
  upcoming: { label: "Upcoming", cellClassName: "text-muted-foreground/70" },
};

function DayStatusSymbol({ status }: { status: DailyTaskDayStatus }) {
  switch (status) {
    case "all-done":
      return <Check aria-hidden className="size-3.5 text-primary" />;
    case "partly-done":
    case "in-progress":
      return <CircleDashed aria-hidden className="size-3.5 text-amber-600 dark:text-amber-400" />;
    case "nothing-due":
      return <Minus aria-hidden className="size-3.5" />;
    case "day-off":
      return <Moon aria-hidden className="size-3.5" />;
    default:
      return null;
  }
}

/**
 * A month of workdays, Monday to Friday. Each day shows its result with both a shade and a
 * symbol, and days in the current streak share a band. Arrow keys move between days.
 */
export default function DailyTaskCalendar({
  visibleMonth,
  today,
  daysByWorkday,
  streakWorkdays,
  selectedWorkday,
  onSelectWorkday,
}: DailyTaskCalendarProps) {
  const dayButtonRefs = useRef(new Map<string, HTMLButtonElement>());

  const weeks = getMonthWorkdayWeeks(visibleMonth);
  const monthWorkdays = weeks.flat().filter((workday): workday is string => workday !== null);
  const focusableWorkday = monthWorkdays.includes(selectedWorkday) ? selectedWorkday : monthWorkdays[0];

  function handleKeyDownGrid(event: KeyboardEvent<HTMLDivElement>) {
    const stepByKey: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -5, ArrowDown: 5 };
    const step = stepByKey[event.key];
    if (step === undefined) {
      return;
    }
    event.preventDefault();
    const currentIndex = monthWorkdays.indexOf(focusableWorkday);
    const nextWorkday = monthWorkdays[Math.min(monthWorkdays.length - 1, Math.max(0, currentIndex + step))];
    onSelectWorkday(nextWorkday);
    dayButtonRefs.current.get(nextWorkday)?.focus();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-1.5 text-center text-xs text-muted-foreground" aria-hidden>
        {WEEKDAY_LABELS.map((weekdayLabel) => (
          <span key={weekdayLabel}>{weekdayLabel}</span>
        ))}
      </div>
      <div role="grid" aria-label="Daily Tasks by workday" onKeyDown={handleKeyDownGrid} className="flex flex-col gap-1.5">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} role="row" className="grid grid-cols-5 gap-1.5">
            {week.map((workday, dayIndex) => {
              if (!workday) {
                return <span key={`blank-${weekIndex}-${dayIndex}`} role="gridcell" aria-hidden className="aspect-square sm:aspect-[4/3]" />;
              }
              const day = daysByWorkday.get(workday);
              const status = getDailyTaskDayStatus(workday, today, day);
              const { label, cellClassName } = DAY_STATUS_DISPLAY[status];
              const isSelected = workday === selectedWorkday;
              const isInStreak = streakWorkdays.has(workday);
              const countText =
                day?.totalCount && day.totalCount > 0 && !day.isDayOff ? `, ${day.doneCount} of ${day.totalCount} done` : "";
              // US-1.2: a record of missed daily updates, not a deadline.
              const missedUpdateCount = countMissedDailyUpdates(workday, today, day);
              const missedUpdateText =
                missedUpdateCount === 0
                  ? ""
                  : `, ${missedUpdateCount} daily ${missedUpdateCount === 1 ? "update" : "updates"} missed`;

              return (
                <span key={workday} role="gridcell" className="relative">
                  {isInStreak && (
                    <span aria-hidden className="absolute inset-x-[-0.375rem] bottom-0 h-1 rounded-full bg-primary/50" />
                  )}
                  <button
                    ref={(dayButton) => {
                      if (dayButton) {
                        dayButtonRefs.current.set(workday, dayButton);
                      } else {
                        dayButtonRefs.current.delete(workday);
                      }
                    }}
                    type="button"
                    tabIndex={workday === focusableWorkday ? 0 : -1}
                    aria-pressed={isSelected}
                    aria-label={`${formatWorkday(workday)}: ${label}${countText}${missedUpdateText}${isInStreak ? ", in your current streak" : ""}${workday === today ? ", today" : ""}`}
                    onClick={() => onSelectWorkday(workday)}
                    className={cn(
                      "relative flex aspect-square w-full flex-col items-center justify-center gap-0.5 rounded-md text-sm tabular-nums transition-colors hover:ring-1 hover:ring-ring/50 focus-visible:outline-2 focus-visible:outline-ring sm:aspect-[4/3]",
                      cellClassName,
                      workday === today && "font-semibold ring-1 ring-primary",
                      isSelected && "ring-2 ring-foreground",
                    )}
                  >
                    {Number(workday.slice(8))}
                    <DayStatusSymbol status={status} />
                    {missedUpdateCount > 0 && (
                      <span
                        aria-hidden
                        className="absolute top-0.5 right-0.5 flex items-center gap-0.5 rounded-full bg-red-100 px-1 text-[10px] leading-4 font-semibold text-red-900 dark:bg-red-500/20 dark:text-red-300"
                      >
                        <ClockAlert className="size-2.5" />
                        {missedUpdateCount}
                      </span>
                    )}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground" aria-label="Legend">
        {(["all-done", "partly-done", "nothing-due", "day-off"] as const).map((status) => (
          <li key={status} className="flex items-center gap-1">
            <DayStatusSymbol status={status} />
            {DAY_STATUS_DISPLAY[status].label}
          </li>
        ))}
        <li className="flex items-center gap-1">
          <span aria-hidden className="h-1 w-4 rounded-full bg-primary/50" />
          Current streak
        </li>
        <li className="flex items-center gap-1">
          <ClockAlert aria-hidden className="size-3.5 text-red-700 dark:text-red-300" />
          Missed daily update
        </li>
      </ul>
    </div>
  );
}
