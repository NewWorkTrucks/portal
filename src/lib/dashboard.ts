const HOUR_MS = 60 * 60 * 1000;

const NO_DATA_LABEL = "No data yet";

const WORKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const UPDATED_AT_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Chicago",
  timeZoneName: "short",
});

/** "45 min", "5 h" or "2 d 4 h". */
export function formatDurationHours(hours: number | null): string {
  if (hours === null) {
    return NO_DATA_LABEL;
  }
  if (hours < 1) {
    return `${Math.max(1, Math.round(hours * 60))} min`;
  }
  if (hours < 48) {
    return `${Math.round(hours)} h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours - days * 24);
  return remainingHours > 0 ? `${days} d ${remainingHours} h` : `${days} d`;
}

/** How long ago `sinceIso` was, measured at the time the dashboard was generated. */
export function formatElapsedSince(sinceIso: string, generatedAtIso: string): string {
  const elapsedHours = (new Date(generatedAtIso).getTime() - new Date(sinceIso).getTime()) / HOUR_MS;
  return formatDurationHours(Math.max(0, elapsedHours));
}

/** A YYYY-MM-DD workday as "Mon, Nov 23", without shifting it across time zones. */
export function formatWorkday(isoDate: string): string {
  return WORKDAY_FORMATTER.format(new Date(`${isoDate}T00:00:00Z`));
}

/** "9:42 AM CST". */
export function formatDashboardUpdatedAt(isoTimestamp: string): string {
  return UPDATED_AT_FORMATTER.format(new Date(isoTimestamp));
}

/** The board deep link that opens a card's details. */
export function getTaskBoardHref(taskId: string): string {
  return `/kanban?task=${encodeURIComponent(taskId)}`;
}
