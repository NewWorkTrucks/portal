export type MentionableKind = "member" | "group";

/** Someone (or a group of people) that can be @-mentioned in a note. */
export type Mentionable = {
  /** What follows the @ in a note, e.g. "Morgan" or "Leadership". */
  handle: string;
  label: string;
  description: string;
  kind: MentionableKind;
  /** Everyone this mention notifies. A member lists only themself. */
  memberNames: readonly string[];
};

export type MentionGroup = {
  handle: string;
  label: string;
  memberNames: readonly string[];
};

/** E3-2: mentioning any of `whenMentioned` also notifies everyone in `alsoNotify`. */
export type MentionAutoIncludeRule = {
  whenMentioned: readonly string[];
  alsoNotify: readonly string[];
};

export type MentionSegment =
  | { kind: "text"; text: string }
  | { kind: "mention"; text: string; mentionable: Mentionable };

export type ActiveMentionQuery = {
  query: string;
  /** Index of the "@" in the text. */
  startIndex: number;
};
