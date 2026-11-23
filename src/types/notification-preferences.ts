/** Which in-app and email notifications the signed-in person receives (E3-3). Everything is on by default. */
export type NotificationPreferences = {
  /** Someone @mentions me, a group I'm in, or someone whose mentions include me. */
  isMentionOn: boolean;
  /** Someone asks me to review their card. */
  isReviewRequestOn: boolean;
  /** Leadership group only: a card moved to Stuck, or one that can't start. */
  isLeadershipAlertOn: boolean;
};
