import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/constants/notification-preferences";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { NotificationPreferencesRow } from "@/types/live/rows";
import type { NotificationPreferences } from "@/types/notification-preferences";

const LIVE_MODE_NOT_SET_UP_MESSAGE = "Live mode isn't set up.";

function toNotificationPreferences(row: NotificationPreferencesRow | null): NotificationPreferences {
  if (!row) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
  return {
    isMentionOn: row.notify_on_mention,
    isReviewRequestOn: row.notify_on_review_request,
    isLeadershipAlertOn: row.notify_on_leadership_alert,
  };
}

/** The signed-in person's preferences (live mode). RLS returns only their own row; no row means all on. */
export async function getMyNotificationPreferences(): Promise<NotificationPreferences> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error(LIVE_MODE_NOT_SET_UP_MESSAGE);
  }
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("notify_on_mention, notify_on_review_request, notify_on_leadership_alert")
    .maybeSingle();
  if (error) {
    throw error;
  }
  return toNotificationPreferences(data as NotificationPreferencesRow | null);
}

/** Saves the signed-in person's preferences (live mode). Resolves to an error message, or null when saved. */
export async function saveMyNotificationPreferences(
  notificationPreferences: NotificationPreferences,
): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return LIVE_MODE_NOT_SET_UP_MESSAGE;
  }
  const { error } = await supabase.rpc("kanban_set_notification_preferences", {
    p_notify_on_mention: notificationPreferences.isMentionOn,
    p_notify_on_review_request: notificationPreferences.isReviewRequestOn,
    p_notify_on_leadership_alert: notificationPreferences.isLeadershipAlertOn,
  });
  return error ? error.message : null;
}
