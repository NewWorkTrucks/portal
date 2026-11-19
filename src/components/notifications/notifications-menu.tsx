"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/current-user-provider";
import { usePortalNotifications } from "@/components/notifications/use-portal-notifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/user-avatar";
import { formatAuditLogTimestamp } from "@/lib/kanban-audit-log";
import { describeNotification } from "@/lib/notifications";
import { toPlainNoteText } from "@/lib/rich-note";
import { cn } from "@/lib/utils";
import type { PortalNotification } from "@/types/notification";

// Shown on the badge; anything above reads "9+".
const MAX_BADGE_COUNT = 9;

/** The header bell: unread count, recent notifications, and a link to each card (E3-3). */
export default function NotificationsMenu() {
  const { notifications, unreadCount, markRead } = usePortalNotifications();
  const { currentBusiness, availableBusinesses, selectBusiness } =
    useCurrentUser();
  const router = useRouter();

  const badgeLabel =
    unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : String(unreadCount);

  function handleClickNotification(notification: PortalNotification) {
    if (!notification.isRead) {
      void markRead([notification.id]);
    }
    const isInAnotherBusiness = notification.businessId !== currentBusiness.id;
    if (
      isInAnotherBusiness &&
      availableBusinesses.some(
        (business) => business.id === notification.businessId,
      )
    ) {
      selectBusiness(notification.businessId);
    }
    // KanbanBoard opens the card's details from ?task= once the card has loaded.
    router.push(`/kanban?task=${encodeURIComponent(notification.taskId)}`);
  }

  function handleClickMarkAllRead() {
    void markRead(null);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
            data-tour="notifications"
          />
        }
      >
        <Bell aria-hidden />
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-semibold text-white"
          >
            {badgeLabel}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {notifications.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              You&rsquo;re all caught up.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => handleClickNotification(notification)}
                  className={cn(
                    "items-start gap-2.5 py-2",
                    !notification.isRead && "bg-primary/5",
                  )}
                >
                  {notification.actorName ? (
                    <UserAvatar
                      name={notification.actorName}
                      className="mt-0.5 shrink-0"
                    />
                  ) : (
                    <Bell aria-hidden className="mt-1" />
                  )}
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                      className={cn(
                        "text-sm leading-snug",
                        !notification.isRead && "font-medium",
                      )}
                    >
                      {describeNotification(notification)}
                    </span>
                    {notification.note && (
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {toPlainNoteText(notification.note)}
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {formatAuditLogTimestamp(notification.createdAt)}
                    </span>
                  </span>
                  {!notification.isRead && (
                    <span
                      aria-label="Unread"
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                    />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </DropdownMenuGroup>

        {unreadCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleClickMarkAllRead}>
              <CheckCheck aria-hidden />
              Mark all as read
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
