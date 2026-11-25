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
 * refuses anyone else and any range over 7 days. Returns none outside live mode.
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
