import type { PortalNotification } from "@/types/notification";

// Sample notifications for the mock signed-in user. Live mode loads them from Supabase (E3-3).
export const MOCK_NOTIFICATIONS: PortalNotification[] = [
  {
    id: "notification-1",
    businessId: "business-nwt",
    taskId: "task-5",
    taskTitle: "Weekly accomplishment report template",
    actorName: "Sam",
    toStatus: "needs-review",
    note: "Draft template submitted to @Avery for first-level review.",
    createdAt: "2026-11-20T15:10:00Z",
    isRead: false,
  },
  {
    id: "notification-2",
    businessId: "business-nwt",
    taskId: "task-7",
    taskTitle: "Migrate tasks from monday.com",
    actorName: "Rowan",
    toStatus: null,
    note: "@Avery can you confirm the batch size before I run the export?",
    createdAt: "2026-11-20T13:45:00Z",
    isRead: false,
  },
  {
    id: "notification-3",
    businessId: "business-nwt",
    taskId: "task-9",
    taskTitle: "Finalize Kanban status definitions",
    actorName: "Morgan",
    toStatus: null,
    note: "Thanks @Avery, approved after department head review.",
    createdAt: "2026-11-19T21:30:00Z",
    isRead: true,
  },
];
