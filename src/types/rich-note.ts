import type { JSONContent } from "@tiptap/react";

/** Work left while serializing a note: a finished line, or a node still to write at a depth. */
export type RichNoteSerializeStep = string | { node: JSONContent; depth: number };

/** Inline content of a formatted note (see src/lib/rich-note.ts for the text format). */
export type RichNoteInline =
  | { kind: "text"; text: string }
  | { kind: "break" }
  | { kind: "bold"; children: RichNoteInline[] }
  | { kind: "italic"; children: RichNoteInline[] }
  | { kind: "link"; href: string; children: RichNoteInline[] };

export type RichNoteListItem = { depth: number; inlines: RichNoteInline[] };

export type RichNoteBlock =
  | { kind: "paragraph"; inlines: RichNoteInline[] }
  | { kind: "bullet-list"; items: RichNoteListItem[] }
  | { kind: "numbered-list"; items: RichNoteListItem[] };
