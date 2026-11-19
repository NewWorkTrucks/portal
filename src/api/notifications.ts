import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { KanbanStatus } from "@/types/kanban";
import type { KanbanNotificationRow } from "@/types/live/rows";
import type {
  PortalNotification,
  PortalNotificationsState,
} from "@/types/notification";

const NOTIFICATION_LIST_LIMIT = 30;

const NOTIFICATION_COLUMNS =
  "id, business_id, task_id, created_at, read_at, " +
  "activity:kanban_activity(note, to_status, actor:profiles(full_name)), task:kanban_tasks(title)";

function toPortalNotification(row: KanbanNotificationRow): PortalNotification {
  return {
    id: row.id,
    businessId: row.business_id,
    taskId: row.task_id,
    taskTitle: row.task?.title ?? "a card",
    actorName: row.activity?.actor?.full_name ?? null,
    toStatus: (row.activity?.to_status as KanbanStatus | null) ?? null,
    note: row.activity?.note ?? "",
    createdAt: row.created_at,
    isRead: row.read_at !== null,
  };
}

/** The signed-in person's latest notifications and unread count (live mode). RLS limits rows to their own. */
export async function listNotifications(): Promise<PortalNotificationsState> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { notifications: [], unreadCount: 0 };
  }

  const [listResult, unreadResult] = await Promise.all([
    supabase
      .from("kanban_notifications")
      .select(NOTIFICATION_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(NOTIFICATION_LIST_LIMIT),
    supabase
      .from("kanban_notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
  ]);
  if (listResult.error) {
    throw listResult.error;
  }
  if (unreadResult.error) {
    throw unreadResult.error;
  }

  return {
    notifications: (listResult.data as unknown as KanbanNotificationRow[]).map(
      toPortalNotification,
    ),
    unreadCount: unreadResult.count ?? 0,
  };
}

/** Marks the given notifications read, or all of them when notificationIds is null (live mode). */
export async function markNotificationsRead(
  notificationIds: string[] | null,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return;
  }
  const { error } = await supabase.rpc("kanban_mark_notifications_read", {
    p_notification_ids: notificationIds,
  });
  if (error) {
    throw error;
  }
}
