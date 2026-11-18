import type {
  ActiveMentionQuery,
  Mentionable,
  MentionAutoIncludeRule,
  MentionGroup,
  MentionSegment,
} from "@/types/mention";
import type { TeamMember } from "@/types/team";

// "@Handle" not preceded by a word character or "@", so emails like a@b.com are not mentions.
const MENTION_PATTERN = /(?<![\w@])@([A-Za-z][\w-]*)/g;
const ACTIVE_MENTION_PATTERN = /(?<![\w@])@([\w-]*)$/;
const MAX_MENTION_SUGGESTIONS = 6;

export function buildMentionables(
  teamMembers: TeamMember[],
  mentionGroups: MentionGroup[],
): Mentionable[] {
  return [
    ...mentionGroups.map((mentionGroup) => ({
      handle: mentionGroup.handle,
      label: mentionGroup.label,
      description: mentionGroup.memberNames.join(", "),
      kind: "group" as const,
      memberNames: mentionGroup.memberNames,
    })),
    ...teamMembers.map((teamMember) => ({
      handle: teamMember.name.replace(/\s+/g, ""),
      label: teamMember.name,
      description: teamMember.jobTitle,
      kind: "member" as const,
      memberNames: [teamMember.name],
    })),
  ];
}

function findMentionable(mentionables: Mentionable[], handle: string): Mentionable | undefined {
  const normalizedHandle = handle.toLowerCase();
  return mentionables.find((mentionable) => mentionable.handle.toLowerCase() === normalizedHandle);
}

/** Splits note text into plain text and recognised @mentions. Unknown @words stay plain text. */
export function parseMentionSegments(text: string, mentionables: Mentionable[]): MentionSegment[] {
  const mentionSegments: MentionSegment[] = [];
  let lastIndex = 0;

  for (const mentionMatch of text.matchAll(MENTION_PATTERN)) {
    const mentionable = findMentionable(mentionables, mentionMatch[1]);
    const matchIndex = mentionMatch.index ?? 0;

    if (!mentionable) {
      continue;
    }
    if (matchIndex > lastIndex) {
      mentionSegments.push({ kind: "text", text: text.slice(lastIndex, matchIndex) });
    }
    mentionSegments.push({ kind: "mention", text: mentionMatch[0], mentionable });
    lastIndex = matchIndex + mentionMatch[0].length;
  }

  if (lastIndex < text.length) {
    mentionSegments.push({ kind: "text", text: text.slice(lastIndex) });
  }

  return mentionSegments;
}

/** Everyone a note notifies: direct mentions, group members, plus auto-included people (E3-2). */
export function resolveMentionedNames(
  text: string,
  mentionables: Mentionable[],
  autoIncludeRules: MentionAutoIncludeRule[],
): string[] {
  const mentionedNames = new Set<string>();

  for (const mentionSegment of parseMentionSegments(text, mentionables)) {
    if (mentionSegment.kind === "mention") {
      mentionSegment.mentionable.memberNames.forEach((memberName) => mentionedNames.add(memberName));
    }
  }

  for (const autoIncludeRule of autoIncludeRules) {
    if (autoIncludeRule.whenMentioned.some((memberName) => mentionedNames.has(memberName))) {
      autoIncludeRule.alsoNotify.forEach((memberName) => mentionedNames.add(memberName));
    }
  }

  return [...mentionedNames];
}

/** The "@query" being typed right before the caret, if any. */
export function getActiveMentionQuery(text: string, caretIndex: number): ActiveMentionQuery | null {
  const mentionMatch = text.slice(0, caretIndex).match(ACTIVE_MENTION_PATTERN);

  if (!mentionMatch || mentionMatch.index === undefined) {
    return null;
  }

  return { query: mentionMatch[1], startIndex: mentionMatch.index };
}

export function filterMentionSuggestions(mentionables: Mentionable[], query: string): Mentionable[] {
  const normalizedQuery = query.toLowerCase();

  return mentionables
    .filter(
      (mentionable) =>
        mentionable.handle.toLowerCase().startsWith(normalizedQuery) ||
        mentionable.label.toLowerCase().startsWith(normalizedQuery),
    )
    .slice(0, MAX_MENTION_SUGGESTIONS);
}
