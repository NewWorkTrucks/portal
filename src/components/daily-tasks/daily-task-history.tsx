"use client";

import { ChevronLeft, ChevronRight, Eye, Flame, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getDailyTaskHistory, getMyDailyTaskHistory, setMyDayOff } from "@/api/daily-tasks";
import { useCurrentUser } from "@/components/current-user-provider";
import DailyTaskCalendar from "@/components/daily-tasks/daily-task-calendar";
import DailyTaskDayList from "@/components/daily-tasks/daily-task-day-list";
import DashboardLoadErrorPanel from "@/components/dashboard/dashboard-load-error";
import { useDataMode } from "@/components/data-mode-provider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserAvatar from "@/components/user-avatar";
import { DAILY_TASK_HISTORY_MONTHS, DAY_OFF_DAYS_AHEAD } from "@/constants/daily-tasks";
import { buildMockDailyTaskHistory, setMockDayOff } from "@/data/mock-daily-tasks";
import { getDailyTaskHistoryPeople } from "@/lib/kanban-permissions";
import { describeRequestError } from "@/lib/request-error";
import {
  addDaysToIsoDate,
  formatYearMonth,
  getCentralToday,
  getCurrentStreakWorkdays,
  getMonthRange,
  getYearMonth,
  isWorkday,
  getPreviousWorkday,
  shiftYearMonth,
} from "@/lib/daily-tasks";
import type { DailyTaskHistoryLoadState } from "@/types/daily-tasks";

const STREAK_LOOKBACK_DAYS = 62;
const MAX_RANGE_DAYS = 93;

/**
 * A person's Daily Tasks history: a workday calendar, the selected day's list, and days off. Admins
 * and department heads can switch to the people they manage (US-1.2); days off stay personal.
 */
export default function DailyTaskHistory() {
  const { dataMode } = useDataMode();
  const { currentUser, teamMembers } = useCurrentUser();

  // Today, the shown month and the selected day are set after mount: the clock can't be read
  // while the page is prerendered.
  const [today, setToday] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<string | null>(null);
  const [selectedWorkday, setSelectedWorkday] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<DailyTaskHistoryLoadState>({ status: "loading" });
  const [reloadCount, setReloadCount] = useState(0);
  const [isSavingDayOff, setIsSavingDayOff] = useState(false);
  const [dayOffError, setDayOffError] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState(currentUser.id);

  // The visible month plus enough earlier days to draw the current streak band.
  const loadRange = useMemo(() => {
    if (!today || !visibleMonth) {
      return null;
    }
    const { firstDay, lastDay } = getMonthRange(visibleMonth);
    const streakStart = addDaysToIsoDate(today, -STREAK_LOOKBACK_DAYS);
    const fromWorkday = firstDay < streakStart ? firstDay : streakStart;
    const toWorkday = lastDay > today ? lastDay : today;
    // The database accepts at most 93 days, so a far-off month skips the streak lookback.
    return addDaysToIsoDate(fromWorkday, MAX_RANGE_DAYS) >= toWorkday
      ? { fromWorkday, toWorkday }
      : { fromWorkday: firstDay, toWorkday: lastDay };
  }, [today, visibleMonth]);
  const daysByWorkday = useMemo(
    () =>
      new Map(loadState.status === "ready" ? loadState.history.days.map((historyDay) => [historyDay.workday, historyDay]) : []),
    [loadState],
  );
  const historyPeople = useMemo(() => getDailyTaskHistoryPeople(currentUser, teamMembers), [currentUser, teamMembers]);
  const personOptions = useMemo(
    () =>
      historyPeople.map((person) => ({
        value: person.id,
        label: person.id === currentUser.id ? `${person.name} (you)` : person.name,
      })),
    [currentUser.id, historyPeople],
  );
  // Falls back to your own history if the picked person is no longer someone you manage.
  const viewedPerson = historyPeople.find((person) => person.id === selectedPersonId) ?? currentUser;
  const isViewingOwnHistory = viewedPerson.id === currentUser.id;
  const viewedPersonId = viewedPerson.id;
  const viewedPersonName = viewedPerson.name;
  const streakWorkdays = useMemo(
    () => (today ? getCurrentStreakWorkdays(daysByWorkday, today, addDaysToIsoDate(today, -STREAK_LOOKBACK_DAYS)) : new Set<string>()),
    [daysByWorkday, today],
  );

  function handleClickPreviousMonth() {
    setVisibleMonth((currentMonth) => (currentMonth ? shiftYearMonth(currentMonth, -1) : currentMonth));
  }

  function handleClickNextMonth() {
    setVisibleMonth((currentMonth) => (currentMonth ? shiftYearMonth(currentMonth, 1) : currentMonth));
  }

  function handleChangePerson(personId: string | null) {
    if (personId) {
      setSelectedPersonId(personId);
      setDayOffError(null);
      setLoadState({ status: "loading" });
    }
  }

  function handleClickRetry() {
    setReloadCount((currentCount) => currentCount + 1);
  }

  async function handleToggleDayOff(workday: string, isDayOff: boolean) {
    setIsSavingDayOff(true);
    setDayOffError(null);
    try {
      if (dataMode === "mock") {
        setMockDayOff(workday, isDayOff);
      } else {
        await setMyDayOff(workday, isDayOff);
      }
      setReloadCount((currentCount) => currentCount + 1);
    } catch (saveError) {
      const { title, description } = describeRequestError(saveError, "change that day");
      setDayOffError(`${title}. ${description}`);
    } finally {
      setIsSavingDayOff(false);
    }
  }

  useEffect(() => {
    const centralToday = getCentralToday();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock is browser-only
    setToday(centralToday);
    setVisibleMonth(getYearMonth(centralToday));
    setSelectedWorkday(isWorkday(centralToday) ? centralToday : getPreviousWorkday(centralToday));
  }, []);

  useEffect(() => {
    if (!loadRange) {
      return;
    }
    let isCancelled = false;
    async function loadHistory(range: { fromWorkday: string; toWorkday: string }) {
      try {
        const history =
          dataMode === "mock"
            ? buildMockDailyTaskHistory(range.fromWorkday, range.toWorkday)
            : isViewingOwnHistory
              ? await getMyDailyTaskHistory(range.fromWorkday, range.toWorkday)
              : await getDailyTaskHistory(viewedPersonId, range.fromWorkday, range.toWorkday);
        if (!isCancelled) {
          setLoadState({ status: "ready", history });
        }
      } catch (loadError) {
        if (!isCancelled) {
          setLoadState({
            status: "error",
            error: describeRequestError(loadError, isViewingOwnHistory ? "load your history" : `load ${viewedPersonName}'s history`),
          });
        }
      }
    }
    void loadHistory(loadRange);
    return () => {
      isCancelled = true;
    };
  }, [dataMode, isViewingOwnHistory, loadRange, reloadCount, viewedPersonId, viewedPersonName]);

  if (!today || !visibleMonth || !selectedWorkday) {
    return <p className="text-sm text-muted-foreground">Loading your history…</p>;
  }

  const earliestMonth = shiftYearMonth(getYearMonth(today), -(DAILY_TASK_HISTORY_MONTHS - 1));
  const latestMonth = getYearMonth(addDaysToIsoDate(today, DAY_OFF_DAYS_AHEAD));

  if (loadState.status === "error") {
    return <DashboardLoadErrorPanel error={loadState.error} onRetry={handleClickRetry} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          {historyPeople.length > 1 && (
            <Select items={personOptions} value={viewedPerson.id} onValueChange={handleChangePerson}>
              <SelectTrigger aria-label="Whose history" className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {historyPeople.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    <UserAvatar name={person.name} className="size-5" />
                    {person.id === currentUser.id ? `${person.name} (you)` : person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {isViewingOwnHistory ? <Lock aria-hidden className="size-3.5" /> : <Eye aria-hidden className="size-3.5" />}
            {isViewingOwnHistory
              ? "Only you, your department head and admins can see this."
              : `Viewing ${viewedPerson.name}'s history. Only they can mark their days off.`}
          </p>
        </div>
        {loadState.status === "ready" && (
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            <Flame aria-hidden className="size-3.5 text-primary" />
            {loadState.history.currentStreak}-workday streak
            <span className="text-muted-foreground">· best {loadState.history.bestStreak}</span>
          </span>
        )}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <section aria-labelledby="daily-task-month" className="flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-4 sm:p-5">
          <header className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous month"
              disabled={visibleMonth <= earliestMonth}
              onClick={handleClickPreviousMonth}
            >
              <ChevronLeft aria-hidden />
            </Button>
            <h2 id="daily-task-month" className="font-heading text-base font-semibold" aria-live="polite">
              {formatYearMonth(visibleMonth)}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next month"
              disabled={visibleMonth >= latestMonth}
              onClick={handleClickNextMonth}
            >
              <ChevronRight aria-hidden />
            </Button>
          </header>
          {loadState.status === "loading" ? (
            <p className="text-sm text-muted-foreground">Loading your history…</p>
          ) : (
            <DailyTaskCalendar
              visibleMonth={visibleMonth}
              today={today}
              daysByWorkday={daysByWorkday}
              streakWorkdays={streakWorkdays}
              selectedWorkday={selectedWorkday}
              onSelectWorkday={setSelectedWorkday}
            />
          )}
        </section>

        <div className="flex min-w-0 flex-col gap-2 rounded-lg border bg-card p-4 sm:p-5">
          <DailyTaskDayList
            workday={selectedWorkday}
            today={today}
            day={daysByWorkday.get(selectedWorkday)}
            isSavingDayOff={isSavingDayOff}
            onToggleDayOff={isViewingOwnHistory ? handleToggleDayOff : undefined}
          />
          {dayOffError && (
            <p role="alert" className="text-sm text-destructive">
              {dayOffError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
