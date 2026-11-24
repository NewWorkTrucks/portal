"use client";

import { useCallback, useEffect, useState } from "react";
import { listNotifications, markNotificationsRead } from "@/api/notifications";
import { useCurrentUser } from "@/components/current-user-provider";
import { useDataMode } from "@/components/data-mode-provider";
import { MOCK_NOTIFICATIONS } from "@/data/mock-notifications";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { showRequestErrorToast } from "@/lib/toast";
import type { PortalNotification } from "@/types/notification";

type PortalNotificationsHookValue = {
  notifications: PortalNotification[];
  unreadCount: number;
  /** Marks the given notifications read, or all of them when notificationIds is null. */
  markRead: (notificationIds: string[] | null) => Promise<void>;
};

function markListRead(
  notifications: PortalNotification[],
  notificationIds: string[] | null,
) {
  return notifications.map((notification) =>
    notificationIds === null || notificationIds.includes(notification.id)
      ? { ...notification, isRead: true }
      : notification,
  );
}

/**
 * The signed-in person's notifications (E3-3). Mock mode uses sample data in memory; live mode
 * loads from Supabase and reloads whenever a notification of theirs arrives or changes.
 */
export function usePortalNotifications(): PortalNotificationsHookValue {
  const { dataMode } = useDataMode();
  const { signedInUser } = useCurrentUser();
  const supabase = dataMode === "live" ? getSupabaseBrowserClient() : null;

  const [notifications, setNotifications] = useState<PortalNotification[]>(
    dataMode === "mock" ? MOCK_NOTIFICATIONS : [],
  );
  const [liveUnreadCount, setLiveUnreadCount] = useState(0);

  const unreadCount =
    dataMode === "mock"
      ? notifications.filter((notification) => !notification.isRead).length
      : liveUnreadCount;

  const loadNotifications = useCallback(async () => {
    try {
      const notificationsState = await listNotifications();
      setNotifications(notificationsState.notifications);
      setLiveUnreadCount(notificationsState.unreadCount);
    } catch (error) {
      // A background refresh: keep what's shown and try again on the next change.
      console.error("Couldn't load notifications", error);
    }
  }, []);

  const markRead = useCallback(
    async (notificationIds: string[] | null) => {
      setNotifications((currentNotifications) =>
        markListRead(currentNotifications, notificationIds),
      );
      if (dataMode === "mock") {
        return;
      }
      try {
        await markNotificationsRead(notificationIds);
      } catch (error) {
        showRequestErrorToast(error, "mark notifications read");
      }
      await loadNotifications();
    },
    [dataMode, loadNotifications],
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading external data on mount
    void loadNotifications();

    // RLS limits Realtime to the signed-in person's own rows; the filter just narrows the stream.
    const realtimeChannel = supabase
      .channel(`kanban-notifications-${signedInUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kanban_notifications",
          filter: `recipient_id=eq.${signedInUser.id}`,
        },
        () => void loadNotifications(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(realtimeChannel);
    };
  }, [supabase, signedInUser.id, loadNotifications]);

  return { notifications, unreadCount, markRead };
}
