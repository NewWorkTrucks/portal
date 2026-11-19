import type { KanbanStatus } from "@/types/kanban";

/** One in-app notification for the signed-in person (E3-3). */
export type PortalNotification = {
  id: string;
  businessId: string;
  taskId: string;
  taskTitle: string;
  /** Who caused it; null when their account was removed. */
  actorName: string | null;
  /** The stage the card moved to, when the notification is about a move. */
  toStatus: KanbanStatus | null;
  note: string;
  createdAt: string;
  isRead: boolean;
};

export type PortalNotificationsState = {
  /** Most recent first. */
  notifications: PortalNotification[];
  /** All unread notifications, including any older than the loaded list. */
  unreadCount: number;
};
