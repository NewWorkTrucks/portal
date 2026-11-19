import { Fragment, type ReactNode } from "react";
import MentionText from "@/components/mention-text";
import { parseRichNote } from "@/lib/rich-note";
import { cn } from "@/lib/utils";
import type { Mentionable } from "@/types/mention";
import type { RichNoteInline, RichNoteListItem } from "@/types/rich-note";

type RichNoteTextProps = {
  note: string;
  mentionables: Mentionable[];
  currentUserName: string;
  className?: string;
};

/**
 * Shows a note with its formatting (bold, italic, links, lists) and @mentions. Built from React
 * elements only, never raw HTML, so a note can't inject markup; links are limited to
 * http(s) and mailto by the parser.
 */
export default function RichNoteText({ note, mentionables, currentUserName, className }: RichNoteTextProps) {
  function renderInlines(inlines: RichNoteInline[]): ReactNode {
    return inlines.map((inline, inlineIndex) => {
      switch (inline.kind) {
        case "text":
          return (
            <MentionText
              key={inlineIndex}
              text={inline.text}
              mentionables={mentionables}
              currentUserName={currentUserName}
            />
          );
        case "break":
          return <br key={inlineIndex} />;
        case "bold":
          return <strong key={inlineIndex}>{renderInlines(inline.children)}</strong>;
        case "italic":
          return <em key={inlineIndex}>{renderInlines(inline.children)}</em>;
        case "link":
          return (
            <a
              key={inlineIndex}
              href={inline.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-primary underline underline-offset-2"
            >
              {renderInlines(inline.children)}
            </a>
          );
      }
    });
  }

  function renderListItems(items: RichNoteListItem[]) {
    return items.map((listItem, itemIndex) => (
      <li key={itemIndex} style={{ marginLeft: `${listItem.depth * 1.25}rem` }}>
        {renderInlines(listItem.inlines)}
      </li>
    ));
  }

  return (
    <div className={cn("flex flex-col gap-1.5 break-words", className)}>
      {parseRichNote(note).map((block, blockIndex) => (
        <Fragment key={blockIndex}>
          {block.kind === "paragraph" && <p>{renderInlines(block.inlines)}</p>}
          {block.kind === "bullet-list" && <ul className="list-disc pl-5">{renderListItems(block.items)}</ul>}
          {block.kind === "numbered-list" && <ol className="list-decimal pl-5">{renderListItems(block.items)}</ol>}
        </Fragment>
      ))}
    </div>
  );
}
