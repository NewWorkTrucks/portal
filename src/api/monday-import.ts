import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { MondayImportRequestItem, MondayImportResult } from "@/types/monday-import";

/** Imports every card in one transaction. The database rejects anyone who isn't an admin of the business. */
export async function importMondayTasks(
  businessId: string,
  importItems: MondayImportRequestItem[],
): Promise<MondayImportResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Live mode isn't set up.");
  }
  const { data, error } = await supabase.rpc("kanban_import_monday_tasks", {
    p_business_id: businessId,
    p_items: importItems,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data as MondayImportResult;
}
