import type { JSONContent } from "@tiptap/react";
import type { RichNoteBlock, RichNoteInline } from "@/types/rich-note";

// Notes are stored as plain text in a small Markdown subset, so the database, search, the
// audit log and older clients all keep working with a string:
//   **bold**  _italic_  [link text](https://…)  "- " bulleted and "1. " numbered list items
//   (two spaces of indent per nesting level), "\n" line breaks, blank lines between paragraphs.
// @mentions stay as "@Handle" text. Anything else is literal; the special characters
// \ * _ [ ] are escaped with a backslash when typed.

const ESCAPED_CHARACTERS = /[\\*_[\]]/g;
const BULLET_LINE = /^( *)[-*] (.*)$/;
const NUMBERED_LINE = /^( *)\d+\. (.*)$/;
const SAFE_LINK_PROTOCOLS = ["http:", "https:", "mailto:"];

// Serializing the editor's document ------------------------------------------------------------

function escapeMarkdownText(text: string): string {
  return text.replace(ESCAPED_CHARACTERS, (character) => `\\${character}`);
}

/** Escapes what would otherwise start a list when it begins a line of a paragraph. */
function escapeLineStart(line: string): string {
  return line.replace(/^(\s*)(\d+)\. /, "$1$2\\. ").replace(/^(\s*)- /, "$1\\- ");
}

function serializeInlineNodes(nodes: JSONContent[] | undefined): string {
  return (nodes ?? [])
    .map((node) => {
      if (node.type === "hardBreak") {
        return "\n";
      }
      if (node.type === "mention") {
        return `@${String(node.attrs?.id ?? "")}`;
      }
      if (node.type !== "text" || !node.text) {
        return "";
      }

      let text = escapeMarkdownText(node.text);
      const markTypes = new Set((node.marks ?? []).map((mark) => mark.type));
      if (markTypes.has("italic")) {
        text = `_${text}_`;
      }
      if (markTypes.has("bold")) {
        text = `**${text}**`;
      }
      const linkMark = node.marks?.find((mark) => mark.type === "link");
      const href = toSafeHref(String(linkMark?.attrs?.href ?? ""));
      if (linkMark && href) {
        text = `[${text}](${href.replace(/\)/g, "%29").replace(/ /g, "%20")})`;
      }
      return text;
    })
    .join("");
}

function serializeBlocks(nodes: JSONContent[] | undefined, depth: number): string[] {
  const lines: string[] = [];
  const indent = "  ".repeat(depth);

  for (const node of nodes ?? []) {
    if (node.type === "paragraph") {
      const paragraphText = serializeInlineNodes(node.content);
      if (paragraphText.trim()) {
        lines.push(
          ...paragraphText.split("\n").map((paragraphLine) => indent + escapeLineStart(paragraphLine)),
          "",
        );
      }
    } else if (node.type === "bulletList" || node.type === "orderedList") {
      (node.content ?? []).forEach((listItem, itemIndex) => {
        const marker = node.type === "bulletList" ? "- " : `${itemIndex + 1}. `;
        const [firstChild, ...nestedChildren] = listItem.content ?? [];
        const itemText =
          firstChild?.type === "paragraph" ? serializeInlineNodes(firstChild.content).replace(/\n/g, " ") : "";
        lines.push(`${indent}${marker}${itemText}`);
        // Nested lists sit one level deeper; extra paragraphs in an item become their own lines.
        const nestedLines = serializeBlocks(nestedChildren, depth + 1).filter((nestedLine) => nestedLine !== "");
        lines.push(...nestedLines);
      });
      lines.push("");
    }
  }
  return lines;
}

/** The editor's document as note text (see the format above). Empty when there's nothing typed. */
export function serializeRichNote(document: JSONContent): string {
  return serializeBlocks(document.content, 0)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Parsing note text for display ---------------------------------------------------------------

export function toSafeHref(href: string): string | null {
  try {
    const url = new URL(href);
    return SAFE_LINK_PROTOCOLS.includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/** Index of the next unescaped `marker` at or after `fromIndex`, or -1. */
function findUnescaped(text: string, marker: string, fromIndex: number): number {
  for (let index = fromIndex; index <= text.length - marker.length; index += 1) {
    if (text[index] === "\\") {
      index += 1;
      continue;
    }
    if (text.startsWith(marker, index)) {
      return index;
    }
  }
  return -1;
}

export function parseInline(text: string): RichNoteInline[] {
  const inlines: RichNoteInline[] = [];
  let plainText = "";

  function flushPlainText() {
    if (plainText) {
      inlines.push({ kind: "text", text: plainText });
      plainText = "";
    }
  }

  let index = 0;
  while (index < text.length) {
    const character = text[index];

    if (character === "\\" && index + 1 < text.length) {
      plainText += text[index + 1];
      index += 2;
      continue;
    }
    if (character === "\n") {
      flushPlainText();
      inlines.push({ kind: "break" });
      index += 1;
      continue;
    }
    if (text.startsWith("**", index)) {
      const closingIndex = findUnescaped(text, "**", index + 2);
      if (closingIndex > index + 2) {
        flushPlainText();
        inlines.push({ kind: "bold", children: parseInline(text.slice(index + 2, closingIndex)) });
        index = closingIndex + 2;
        continue;
      }
    }
    if (character === "_") {
      const closingIndex = findUnescaped(text, "_", index + 1);
      if (closingIndex > index + 1) {
        flushPlainText();
        inlines.push({ kind: "italic", children: parseInline(text.slice(index + 1, closingIndex)) });
        index = closingIndex + 1;
        continue;
      }
    }
    if (character === "[") {
      const closingBracketIndex = findUnescaped(text, "](", index + 1);
      const closingParenthesisIndex = closingBracketIndex === -1 ? -1 : text.indexOf(")", closingBracketIndex + 2);
      const href = closingParenthesisIndex === -1 ? null : toSafeHref(text.slice(closingBracketIndex + 2, closingParenthesisIndex));
      if (href) {
        flushPlainText();
        inlines.push({ kind: "link", href, children: parseInline(text.slice(index + 1, closingBracketIndex)) });
        index = closingParenthesisIndex + 1;
        continue;
      }
    }

    plainText += character;
    index += 1;
  }

  flushPlainText();
  return inlines;
}

/** Note text as blocks for display. Plain notes written before the editor parse as paragraphs. */
export function parseRichNote(note: string): RichNoteBlock[] {
  const blocks: RichNoteBlock[] = [];
  let paragraphLines: string[] = [];

  function flushParagraph() {
    if (paragraphLines.length > 0) {
      blocks.push({ kind: "paragraph", inlines: parseInline(paragraphLines.join("\n")) });
      paragraphLines = [];
    }
  }

  for (const line of note.split("\n")) {
    const bulletMatch = BULLET_LINE.exec(line);
    const numberedMatch = bulletMatch ? null : NUMBERED_LINE.exec(line);
    const listMatch = bulletMatch ?? numberedMatch;

    if (listMatch) {
      flushParagraph();
      const listKind = bulletMatch ? "bullet-list" : "numbered-list";
      const depth = Math.floor(listMatch[1].length / 2);
      const listItem = { depth, inlines: parseInline(listMatch[2]) };
      const previousBlock = blocks.at(-1);
      if (previousBlock?.kind === listKind) {
        previousBlock.items.push(listItem);
      } else {
        blocks.push({ kind: listKind, items: [listItem] });
      }
    } else if (line.trim() === "") {
      flushParagraph();
    } else {
      paragraphLines.push(line);
    }
  }

  flushParagraph();
  return blocks;
}

function inlinesToPlainText(inlines: RichNoteInline[]): string {
  return inlines
    .map((inline) => {
      switch (inline.kind) {
        case "text":
          return inline.text;
        case "break":
          return " ";
        default:
          return inlinesToPlainText(inline.children);
      }
    })
    .join("");
}

/** Note text without formatting, on one line, for compact places such as cards and notifications. */
export function toPlainNoteText(note: string): string {
  return parseRichNote(note)
    .map((block) =>
      block.kind === "paragraph"
        ? inlinesToPlainText(block.inlines)
        : block.items.map((listItem) => `• ${inlinesToPlainText(listItem.inlines)}`).join(" "),
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
