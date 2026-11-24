import type { DashboardLoadError } from "@/types/dashboard";

const HOUR_MS = 60 * 60 * 1000;

// PostgREST and Postgres error codes the dashboard can hit.
const FUNCTION_NOT_FOUND_CODES = new Set(["PGRST202", "42883"]);
const SESSION_EXPIRED_CODES = new Set(["PGRST301", "PGRST302", "PGRST303"]);
const STATEMENT_TIMEOUT_CODE = "57014";
const NETWORK_FAILURE_PATTERN = /failed to fetch|networkerror|load failed|network request failed/i;
const LIVE_MODE_NOT_SET_UP_MESSAGE = "Live mode isn't set up.";

function readErrorField(loadError: unknown, fieldName: "code" | "message"): string {
  if (typeof loadError === "object" && loadError !== null && fieldName in loadError) {
    const fieldValue = (loadError as Record<string, unknown>)[fieldName];
    return typeof fieldValue === "string" ? fieldValue : "";
  }
  return "";
}

/**
 * Turns a failed dashboard load into a plain-language cause and next step. The raw code and
 * message stay in technicalDetails so the development lead can still trace it.
 */
export function describeDashboardLoadError(loadError: unknown): DashboardLoadError {
  const errorCode = readErrorField(loadError, "code");
  const errorMessage = readErrorField(loadError, "message") || String(loadError);
  const technicalDetails = errorCode ? `${errorCode}: ${errorMessage}` : errorMessage;
  const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;

  if (isOffline || (!errorCode && NETWORK_FAILURE_PATTERN.test(errorMessage))) {
    return {
      title: "Can't reach the portal's server",
      description: "You may be offline, or the connection dropped. Check your internet connection, then try again.",
      technicalDetails,
    };
  }
  if (FUNCTION_NOT_FOUND_CODES.has(errorCode)) {
    return {
      title: "The dashboard isn't set up on the database yet",
      description: "Its database update hasn't been deployed. Ask the development lead to deploy it, then try again.",
      technicalDetails,
    };
  }
  if (SESSION_EXPIRED_CODES.has(errorCode) || /jwt/i.test(errorMessage)) {
    return {
      title: "Your sign-in has expired",
      description: "Sign out and sign in again, then reopen the dashboard.",
      technicalDetails,
    };
  }
  if (errorCode === STATEMENT_TIMEOUT_CODE) {
    return {
      title: "The dashboard took too long to load",
      description: "The database stopped counting before it finished. Try again in a moment; if it keeps happening, tell the development lead.",
      technicalDetails,
    };
  }
  if (errorMessage === LIVE_MODE_NOT_SET_UP_MESSAGE) {
    return {
      title: "Live data isn't connected in this build",
      description: "The portal has no Supabase settings, so it can't load real data. Ask the development lead to check the environment settings.",
      technicalDetails,
    };
  }
  return {
    title: "The database couldn't build the dashboard",
    description: "Something went wrong on the server. Try again; if it keeps happening, send the development lead the technical details below.",
    technicalDetails,
  };
}
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
