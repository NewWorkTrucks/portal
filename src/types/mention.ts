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

/** A mention group as admins edit it in Settings (E3-1). */
export type EditableMentionGroup = {
  id: string;
  handle: string;
  label: string;
  memberIds: string[];
};

export type MentionGroupFormValues = {
  label: string;
  /** What follows the @. Fixed once the group exists, because earlier notes mention it. */
  handle: string;
};
