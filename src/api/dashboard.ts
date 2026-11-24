import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { LeadershipDashboard, LeadershipDashboardResult } from "@/types/dashboard";

const PERMISSION_DENIED_CODE = "42501";

/**
 * The Leadership dashboard for a business (live mode). The database decides who may see it:
 * Leadership group members and admins. Anyone else gets "not-allowed".
 */
export async function getLeadershipDashboard(businessId: string): Promise<LeadershipDashboardResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Live mode isn't set up.");
  }

  const { data, error } = await supabase.rpc("kanban_get_leadership_dashboard", {
    p_business_id: businessId,
  });
  if (error?.code === PERMISSION_DENIED_CODE) {
    return { status: "not-allowed" };
  }
  if (error) {
    throw error;
  }
  return { status: "ready", dashboard: data as LeadershipDashboard };
}
