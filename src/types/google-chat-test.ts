export type GoogleChatTestKind = "message" | "summary";

export type GoogleChatTestResult = {
  /** False when this business has no Google Chat webhook set up. */
  isQueued: boolean;
  /** How many cards the 6 PM preview listed. */
  cardCount: number;
};
