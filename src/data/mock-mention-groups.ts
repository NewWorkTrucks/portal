import type { MentionAutoIncludeRule, MentionGroup } from "@/types/mention";

// TODO: Load from the backend and make group membership editable by admins (E3-1).
export const MOCK_MENTION_GROUPS: MentionGroup[] = [
  { handle: "Leadership", label: "Leadership", memberNames: ["Miggy", "Erik", "Kc", "Chris"] },
];

// TODO: Load from the backend once escalation rules are configurable (E3-2).
export const MOCK_MENTION_AUTO_INCLUDE_RULES: MentionAutoIncludeRule[] = [
  { whenMentioned: ["Chris", "Kc"], alsoNotify: ["Miggy", "Kc", "Erik"] },
];
