"use client";

import { Circle, CircleCheck } from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "@/components/current-user-provider";
import { DAILY_TASK_KIND_ICONS } from "@/constants/daily-tasks";
import { getTaskBoardHref } from "@/lib/dashboard";
import { describeDailyTask, formatDoneTime, formatTimeLeft } from "@/lib/daily-tasks";
import { cn } from "@/lib/utils";
import type { DailyTaskItemRowProps } from "@/types/daily-tasks";

/** One to-do: done or open, what to do, and a link to the card. */
export default function DailyTaskItemRow({ item, businessName, isToday, nowTimestamp }: DailyTaskItemRowProps) {
  const { currentBusiness, availableBusinesses, selectBusiness } = useCurrentUser();

  const KindIcon = DAILY_TASK_KIND_ICONS[item.kind];
  const statusText = item.isDone
    ? item.doneAt
      ? `Done ${formatDoneTime(item.doneAt)}`
      : "Done"
    : item.kind === "daily-update" && isToday
      ? nowTimestamp > 0
        ? `Due by 6 PM · ${formatTimeLeft(item.dueBy, nowTimestamp)}`
        : "Due by 6 PM"
      : isToday
        ? "Due today"
        : item.kind === "daily-update"
          ? "Missed: no update by 6 PM"
          : "Not done";
  // US-1.2: a past daily update that never came is called out, so the record is easy to spot.
  const isMissedDailyUpdate = item.kind === "daily-update" && !item.isDone && !isToday;
  const detailText = [
    item.kind === "catch-up" && item.totalCount !== null ? `${item.doneCount ?? 0} of ${item.totalCount} seen` : null,
    businessName,
    statusText,
  ]
    .filter(Boolean)
    .join(" · ");

  // The card may belong to another business; switch to it first, as notifications do.
  function handleClickCardLink() {
    if (
      item.businessId &&
      item.businessId !== currentBusiness.id &&
      availableBusinesses.some((business) => business.id === item.businessId)
    ) {
      selectBusiness(item.businessId);
    }
  }

  const rowContent = (
    <>
      {item.isDone ? (
        <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
      ) : (
        <Circle aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("break-words", item.isDone && "text-muted-foreground line-through decoration-muted-foreground/50")}>
          {describeDailyTask(item, isToday)}
        </span>
        <span
          className={cn(
            "flex items-center gap-1 text-xs text-muted-foreground",
            isMissedDailyUpdate && "font-medium text-red-700 dark:text-red-300",
          )}
        >
          <KindIcon aria-hidden className="size-3 shrink-0" />
          {detailText}
        </span>
      </span>
      <span className="sr-only">{item.isDone ? "(done)" : "(not done)"}</span>
    </>
  );

  return (
    <li>
      {item.taskId ? (
        <Link
          href={getTaskBoardHref(item.taskId)}
          onClick={handleClickCardLink}
          className="flex min-h-11 items-start gap-2.5 px-3 py-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
        >
          {rowContent}
        </Link>
      ) : (
        <div className="flex min-h-11 items-start gap-2.5 px-3 py-2 text-sm">{rowContent}</div>
      )}
    </li>
  );
}
