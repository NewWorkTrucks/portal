import { Fragment } from "react";
import { parseMentionSegments } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import type { Mentionable } from "@/types/mention";

type MentionTextProps = {
  text: string;
  mentionables: Mentionable[];
  currentUserName: string;
};

/** Renders note text with @mentions styled, and mentions that include the current user highlighted. */
export default function MentionText({ text, mentionables, currentUserName }: MentionTextProps) {
  return (
    <>
      {parseMentionSegments(text, mentionables).map((mentionSegment, segmentIndex) => {
        if (mentionSegment.kind === "text") {
          return <Fragment key={segmentIndex}>{mentionSegment.text}</Fragment>;
        }

        const isCurrentUserMentioned =
          mentionSegment.mentionable.memberNames.includes(currentUserName);

        return (
          <span
            key={segmentIndex}
            className={cn(
              "font-medium",
              isCurrentUserMentioned
                ? "rounded-sm bg-amber-200 px-0.5 text-amber-950 dark:bg-amber-400/30 dark:text-amber-100"
                : "text-primary",
            )}
            title={isCurrentUserMentioned ? "Mentions you" : undefined}
          >
            {mentionSegment.text}
          </span>
        );
      })}
    </>
  );
}
