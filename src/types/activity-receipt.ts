/** One person a card update notified, and when they had it on screen. */
export type ActivityReceipt = {
  activityId: string;
  recipientId: string;
  recipientName: string;
  /** Null until the person has seen the update. */
  seenAt: string | null;
};

export type ActivityReceiptListProps = {
  receipts: readonly ActivityReceipt[];
};

export type ActivityReceiptRow = {
  activity_id: string;
  recipient_id: string;
  recipient_name: string;
  seen_at: string | null;
};

export type TaskReceiptsState = {
  /** Receipts the signed-in person may see: their own updates, or all if they're in Leadership. */
  receipts: ActivityReceipt[];
  /** Updates on this card that notified the signed-in person and they haven't seen yet. */
  unseenActivityIds: string[];
};
