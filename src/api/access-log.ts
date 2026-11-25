import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { AccessLogRow } from "@/types/access-log";

type AccessLogRpcRow = {
  occurred_at: string;
  person_name: string;
  ip_address: string | null;
  source: AccessLogRow["source"];
  outcome: AccessLogRow["outcome"];
  method: string;
  path: string;
  user_agent: string;
  details: Record<string, unknown>;
};

/**
 * Access log rows for US Central dates, newest first. Only selected viewers get rows; the database
 * refuses anyone else. Returns none outside live mode.
 */
export async function getAccessLogRows(fromDate: string, toDate: string): Promise<AccessLogRow[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.rpc("access_log_rows", {
    p_from_date: fromDate,
    p_to_date: toDate,
    p_user_id: null,
  });
  if (error) {
    throw error;
  }

  return ((data ?? []) as AccessLogRpcRow[]).map((accessLogRpcRow) => ({
    occurredAt: accessLogRpcRow.occurred_at,
    personName: accessLogRpcRow.person_name,
    ipAddress: accessLogRpcRow.ip_address,
    source: accessLogRpcRow.source,
    outcome: accessLogRpcRow.outcome,
    method: accessLogRpcRow.method,
    path: accessLogRpcRow.path,
    userAgent: accessLogRpcRow.user_agent,
    details: accessLogRpcRow.details,
  }));
}

/** Whether the signed-in person is on the viewer list. Any failure counts as no, so the link stays hidden. */
export async function canViewAccessLog(): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase.rpc("access_log_can_view");
  return !error && data === true;
}

/**
 * Records an in-app page change for the signed-in person (US-9.3). The database takes the person
 * from the session and the IP from the request. Never throws: a failed record is logged to the
 * console and the page carries on, so the access log can't get in anyone's way.
 */
export async function recordPageVisit(path: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase.rpc("access_log_record_visit", { p_path: path });
  if (error) {
    console.error(`Access log visit not recorded: ${error.code} ${error.message}`);
  }
}
