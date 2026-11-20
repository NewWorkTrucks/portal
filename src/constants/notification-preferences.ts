import type { NotificationPreferences } from "@/types/notification-preferences";

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  isMentionOn: true,
  isReviewRequestOn: true,
  isLeadershipAlertOn: true,
};

export const NOTIFICATION_PREFERENCE_OPTIONS: {
  preferenceName: keyof NotificationPreferences;
  label: string;
  description: string;
}[] = [
  {
    preferenceName: "isMentionOn",
    label: "Mentions",
    description: "Someone @mentions you or a group you're in.",
  },
  {
    preferenceName: "isReviewRequestOn",
    label: "Review requests",
    description: "Someone picks you to review their card.",
  },
  {
    preferenceName: "isLeadershipAlertOn",
    label: "Leadership alerts",
    description: "A card moves to Stuck or can't start. Only sent to the Leadership group.",
  },
];
