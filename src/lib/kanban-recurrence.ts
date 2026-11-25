import type {
  KanbanIsoWeekday,
  KanbanRecurrencePreset,
  KanbanRecurrencePresetId,
  KanbanRecurrenceRule,
} from "@/types/kanban-recurrence";

const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ORDINALS = ["first", "second", "third", "fourth", "fifth"];
const WORKWEEK: KanbanIsoWeekday[] = [1, 2, 3, 4, 5];

const MONTH_DAY_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function toUtcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

/** ISO weekday of a YYYY-MM-DD date. */
export function getIsoWeekday(isoDate: string): KanbanIsoWeekday {
  const sundayBasedDay = toUtcDate(isoDate).getUTCDay();
  return (sundayBasedDay === 0 ? 7 : sundayBasedDay) as KanbanIsoWeekday;
}

export function getWeekdayName(weekday: KanbanIsoWeekday): string {
  return WEEKDAY_NAMES[weekday - 1];
}

/** "second Tuesday" for the date's weekday and its place in the month. */
function describeWeekdayOfMonth(isoDate: string): string {
  const dayOfMonth = Number(isoDate.slice(8, 10));
  return `${ORDINALS[Math.ceil(dayOfMonth / 7) - 1]} ${getWeekdayName(getIsoWeekday(isoDate))}`;
}

/** "9:00 AM" from "09:00". */
export function formatRecurrenceTime(time: string): string {
  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const period = hour < 12 ? "AM" : "PM";
  return `${hour % 12 === 0 ? 12 : hour % 12}:${minuteText} ${period}`;
}

function isWorkweek(weekdays: KanbanIsoWeekday[] | undefined): boolean {
  return weekdays?.length === WORKWEEK.length && WORKWEEK.every((weekday) => weekdays.includes(weekday));
}

function describeWeekdays(weekdays: KanbanIsoWeekday[]): string {
  return [...weekdays]
    .sort((firstWeekday, secondWeekday) => firstWeekday - secondWeekday)
    .map((weekday) => getWeekdayName(weekday).slice(0, 3))
    .join(", ");
}

/** The repeat in plain words, e.g. "every weekday at 9:00 AM" or "every 2 weeks on Mon, Wed, until Dec 31, 2026". */
export function describeRecurrence(rule: KanbanRecurrenceRule, time: string): string {
  const { frequency, interval } = rule;
  const unitByFrequency = { daily: "day", weekly: "week", monthly: "month", yearly: "year" } as const;
  const every = interval === 1 ? `every ${unitByFrequency[frequency]}` : `every ${interval} ${unitByFrequency[frequency]}s`;

  let pattern: string;
  if (frequency === "weekly" && interval === 1 && isWorkweek(rule.weekdays)) {
    pattern = "every weekday";
  } else if (frequency === "daily") {
    pattern = interval === 1 ? "daily" : every;
  } else if (frequency === "weekly") {
    pattern = `${interval === 1 ? "weekly" : every} on ${describeWeekdays(rule.weekdays ?? [])}`;
  } else if (frequency === "monthly") {
    const onWhat =
      rule.monthlyBy === "weekday-of-month"
        ? `the ${describeWeekdayOfMonth(rule.startDate)}`
        : `day ${Number(rule.startDate.slice(8, 10))}`;
    pattern = `${interval === 1 ? "monthly" : every} on ${onWhat}`;
  } else {
    pattern = `${interval === 1 ? "annually" : every} on ${MONTH_DAY_FORMATTER.format(toUtcDate(rule.startDate))}`;
  }

  const ending = rule.endsOn
    ? `, until ${FULL_DATE_FORMATTER.format(toUtcDate(rule.endsOn))}`
    : rule.endsAfterCount
      ? `, ${rule.endsAfterCount} ${rule.endsAfterCount === 1 ? "time" : "times"}`
      : "";
  return `${pattern} at ${formatRecurrenceTime(time)}${ending}`;
}

/** The quick choices for a start date, labelled like Google Calendar's repeat menu. */
export function getRecurrencePresets(startDate: string): KanbanRecurrencePreset[] {
  const weekdayName = getWeekdayName(getIsoWeekday(startDate));
  return [
    { id: "none", label: "Does not repeat" },
    { id: "daily", label: "Daily" },
    { id: "weekly", label: `Weekly on ${weekdayName}` },
    { id: "monthly", label: `Monthly on the ${describeWeekdayOfMonth(startDate)}` },
    { id: "yearly", label: `Annually on ${MONTH_DAY_FORMATTER.format(toUtcDate(startDate))}` },
    { id: "weekdays", label: "Every weekday (Monday to Friday)" },
    { id: "custom", label: "Custom…" },
  ];
}

/** The rule a quick choice stands for. Null for "Does not repeat" and "Custom…". */
export function buildPresetRule(presetId: KanbanRecurrencePresetId, startDate: string): KanbanRecurrenceRule | null {
  switch (presetId) {
    case "daily":
      return { frequency: "daily", interval: 1, startDate };
    case "weekly":
      return { frequency: "weekly", interval: 1, weekdays: [getIsoWeekday(startDate)], startDate };
    case "monthly":
      return { frequency: "monthly", interval: 1, monthlyBy: "weekday-of-month", startDate };
    case "yearly":
      return { frequency: "yearly", interval: 1, startDate };
    case "weekdays":
      return { frequency: "weekly", interval: 1, weekdays: WORKWEEK, startDate };
    default:
      return null;
  }
}

/** Which quick choice a saved rule matches, so the form opens on it; "custom" when none does. */
export function getMatchingPresetId(rule: KanbanRecurrenceRule): KanbanRecurrencePresetId {
  const presetIds: KanbanRecurrencePresetId[] = ["daily", "weekly", "monthly", "yearly", "weekdays"];
  if (rule.endsOn || rule.endsAfterCount) {
    return "custom";
  }
  return presetIds.find((presetId) => isSameRepeatPattern(buildPresetRule(presetId, rule.startDate), rule)) ?? "custom";
}

/** Same frequency, interval, weekdays and monthly mode; the database may add empty fields, so JSON can't be compared. */
function isSameRepeatPattern(presetRule: KanbanRecurrenceRule | null, rule: KanbanRecurrenceRule): boolean {
  if (!presetRule || presetRule.frequency !== rule.frequency || presetRule.interval !== rule.interval) {
    return false;
  }
  if (rule.frequency === "weekly") {
    const sortedPresetWeekdays = [...(presetRule.weekdays ?? [])].sort().join(",");
    const sortedRuleWeekdays = [...(rule.weekdays ?? [])].sort().join(",");
    return sortedPresetWeekdays === sortedRuleWeekdays;
  }
  if (rule.frequency === "monthly") {
    return presetRule.monthlyBy === (rule.monthlyBy ?? "day-of-month");
  }
  return true;
}
