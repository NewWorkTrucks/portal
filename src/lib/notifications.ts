import { getColumnTitle } from "@/lib/kanban";
import type { PortalNotification } from "@/types/notification";

/** One line saying what happened, e.g. "Sam asked you to review “Weekly report”". */
export function describeNotification(notification: PortalNotification): string {
  const actorName = notification.actorName ?? "Someone";
  const taskTitle = `“${notification.taskTitle}”`;

  switch (notification.toStatus) {
    case "needs-review":
      return `${actorName} asked you to review ${taskTitle}`;
    case "stuck":
    case "deferred":
      return `${actorName} moved ${taskTitle} to ${getColumnTitle(notification.toStatus)}`;
    default:
      return `${actorName} mentioned you on ${taskTitle}`;
  }
}
