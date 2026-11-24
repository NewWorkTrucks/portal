import type { RequestErrorDescription } from "@/types/request-error";

// PostgREST and Postgres error codes the portal can hit.
const FUNCTION_NOT_FOUND_CODES = new Set(["PGRST202", "42883"]);
const SESSION_EXPIRED_CODES = new Set(["PGRST301", "PGRST302", "PGRST303"]);
const PERMISSION_DENIED_CODE = "42501";
const STATEMENT_TIMEOUT_CODE = "57014";
const NETWORK_FAILURE_PATTERN = /failed to fetch|networkerror|load failed|network request failed/i;
const LIVE_MODE_NOT_SET_UP_MESSAGE = "Live mode isn't set up.";

function readErrorField(requestError: unknown, fieldName: "code" | "message"): string {
  if (typeof requestError === "object" && requestError !== null && fieldName in requestError) {
    const fieldValue = (requestError as Record<string, unknown>)[fieldName];
    return typeof fieldValue === "string" ? fieldValue : "";
  }
  return "";
}

/**
 * Turns a failed request into a plain-language cause and next step. `failedAction` finishes
 * "Couldn't …" for errors with no better explanation, e.g. "load the board" or "post your
 * comment". The raw code and message stay in technicalDetails so the development lead can
 * still trace it.
 */
export function describeRequestError(requestError: unknown, failedAction: string): RequestErrorDescription {
  const errorCode = readErrorField(requestError, "code");
  const errorMessage = readErrorField(requestError, "message") || String(requestError);
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
      title: "The database isn't up to date",
      description: "A database update this needs hasn't been deployed. Ask the development lead to deploy it, then try again.",
      technicalDetails,
    };
  }
  if (SESSION_EXPIRED_CODES.has(errorCode) || /jwt/i.test(errorMessage)) {
    return {
      title: "Your sign-in has expired",
      description: "Sign out and sign in again, then try again.",
      technicalDetails,
    };
  }
  if (errorCode === PERMISSION_DENIED_CODE) {
    return {
      title: `You can't ${failedAction}`,
      description: "Your role doesn't allow this. Ask an admin if you think it should.",
      technicalDetails,
    };
  }
  if (errorCode === STATEMENT_TIMEOUT_CODE) {
    return {
      title: "That took too long",
      description: "The database stopped before it finished. Try again in a moment; if it keeps happening, tell the development lead.",
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
    title: `Couldn't ${failedAction}`,
    description: "Something went wrong on the server. Try again; if it keeps happening, send the development lead the technical details.",
    technicalDetails,
  };
}
