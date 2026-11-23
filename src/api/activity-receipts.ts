import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type {
  ActivityReceiptRow,
  TaskReceiptsState,
} from "@/types/activity-receipt";

/** A card's receipts the signed-in person may see, plus what they still haven't seen themselves. */
export async function getTaskReceipts(taskId: string): Promise<TaskReceiptsState> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { receipts: [], unseenActivityIds: [] };
  }

  const [receiptsResult, unseenResult] = await Promise.all([
    supabase.rpc("kanban_list_task_receipts", { p_task_id: taskId }),
    // RLS limits notifications to the signed-in person's own.
    supabase
      .from("kanban_notifications")
      .select("activity_id")
      .eq("task_id", taskId)
      .is("seen_at", null),
  ]);
  if (receiptsResult.error) {
    throw receiptsResult.error;
  }
  if (unseenResult.error) {
    throw unseenResult.error;
  }

  return {
    receipts: (receiptsResult.data as ActivityReceiptRow[]).map((receiptRow) => ({
      activityId: receiptRow.activity_id,
      recipientId: receiptRow.recipient_id,
      recipientName: receiptRow.recipient_name,
      seenAt: receiptRow.seen_at,
    })),
    unseenActivityIds: (unseenResult.data as { activity_id: string }[]).map(
      (unseenRow) => unseenRow.activity_id,
    ),
  };
}

/** Records that the signed-in person saw these updates, which also clears them from the bell. */
export async function markActivitySeen(activityIds: string[]): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return;
  }
  const { error } = await supabase.rpc("kanban_mark_activity_seen", {
    p_activity_ids: activityIds,
  });
  if (error) {
    throw error;
  }
}
