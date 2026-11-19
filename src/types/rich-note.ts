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
