import type { AccessLogOutcome } from "@/types/access-log";

/** Server-only. Writes to public.access_log with the secret key, which the browser never sees. */
export type AccessLogWriteEntry = {
  userId: string | null;
  ipAddress: string | null;
  path: string;
  method: string;
  userAgent: string;
  outcome: AccessLogOutcome;
};

/** The visitor's address: the first entry in x-forwarded-for, as Vercel sets it. */
export function getRequestIpAddress(requestHeaders: Headers): string | null {
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || requestHeaders.get("x-real-ip") || null;
}

/**
 * Adds one row to the access log. Never throws: a failed write is logged to the server console and
 * the page still loads, so the access log can't lock anyone out.
 */
export async function writeAccessLogEntry(accessLogEntry: AccessLogWriteEntry): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !secretKey) {
    console.error("Access log not written: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY is not set.");
    return;
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/access_log`, {
      method: "POST",
      headers: {
        apikey: secretKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        user_id: accessLogEntry.userId,
        ip_address: accessLogEntry.ipAddress,
        source: "page",
        outcome: accessLogEntry.outcome,
        method: accessLogEntry.method,
        path: accessLogEntry.path,
        user_agent: accessLogEntry.userAgent,
      }),
    });
    if (!response.ok) {
      console.error(`Access log not written: HTTP ${response.status} ${await response.text()}`);
    }
  } catch (writeError) {
    console.error("Access log not written:", writeError);
  }
}
