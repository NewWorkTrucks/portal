"use client";

import Mention from "@tiptap/extension-mention";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, mergeAttributes, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";
import { Bold, Italic, Link2, Link2Off, List, ListOrdered, type LucideIcon, Users } from "lucide-react";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserAvatar from "@/components/user-avatar";
import { filterMentionSuggestions } from "@/lib/mentions";
import { serializeRichNote, toSafeHref } from "@/lib/rich-note";
import { cn } from "@/lib/utils";
import type { Mentionable } from "@/types/mention";

type RichNoteEditorProps = {
  id: string;
  /** The note as text (see src/lib/rich-note.ts). Only "" is applied after mount, to clear it. */
  value: string;
  onChange: (value: string) => void;
  mentionables: Mentionable[];
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
  "aria-invalid"?: boolean;
};

type ToolbarButton = {
  label: string;
  Icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
};

type MentionSuggestionState = {
  items: Mentionable[];
  command: (attributes: { id: string; label: string }) => void;
};

const LINE_HEIGHT_REM = 1.5;

// Styles for the editable area: lists, links, paragraph spacing and the placeholder.
const EDITOR_CONTENT_CLASS_NAME = [
  "outline-none",
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
  "[&_p+p]:mt-1.5 [&_p+ul]:mt-1.5 [&_p+ol]:mt-1.5 [&_ul+p]:mt-1.5 [&_ol+p]:mt-1.5",
  "[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left",
  "[&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-muted-foreground",
  "[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
].join(" ");

/**
 * A formatted note editor (bold, italic, lists, links) with @mention suggestions. What you see
 * is what gets posted; the note is saved as text with simple formatting marks.
 */
export default function RichNoteEditor({
  id,
  value,
  onChange,
  mentionables,
  placeholder,
  rows = 3,
  autoFocus,
  "aria-invalid": ariaInvalid,
}: RichNoteEditorProps) {
  const suggestionListId = useId();
  // The editor is created once; refs give its callbacks the latest props and state.
  const mentionablesRef = useRef(mentionables);
  const onChangeRef = useRef(onChange);
  const suggestionStateRef = useRef<MentionSuggestionState | null>(null);
  const highlightedIndexRef = useRef(0);

  const [suggestionState, setSuggestionState] = useState<MentionSuggestionState | null>(null);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(0);
  const [isLinkFormOpen, setIsLinkFormOpen] = useState(false);
  const [linkAddress, setLinkAddress] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  function updateSuggestionState(nextState: MentionSuggestionState | null) {
    suggestionStateRef.current = nextState;
    highlightedIndexRef.current = 0;
    setSuggestionState(nextState);
    setHighlightedSuggestionIndex(0);
  }

  function highlightSuggestion(index: number) {
    highlightedIndexRef.current = index;
    setHighlightedSuggestionIndex(index);
  }

  function selectSuggestion(mentionable: Mentionable) {
    suggestionStateRef.current?.command({ id: mentionable.handle, label: mentionable.handle });
  }

  function handleSuggestionKeyDown({ event }: SuggestionKeyDownProps): boolean {
    const currentState = suggestionStateRef.current;
    if (!currentState || currentState.items.length === 0) {
      return false;
    }
    const itemCount = currentState.items.length;
    switch (event.key) {
      case "ArrowDown":
        highlightSuggestion((highlightedIndexRef.current + 1) % itemCount);
        return true;
      case "ArrowUp":
        highlightSuggestion((highlightedIndexRef.current - 1 + itemCount) % itemCount);
        return true;
      case "Enter":
      case "Tab":
        selectSuggestion(currentState.items[highlightedIndexRef.current]);
        return true;
      case "Escape":
        // Close the suggestions without also closing the surrounding dialog.
        event.stopPropagation();
        updateSuggestionState(null);
        return true;
      default:
        return false;
    }
  }

  const editor = useEditor({
    immediatelyRender: false,
    autofocus: autoFocus ? "end" : false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", protocols: ["http", "https", "mailto"] },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      // eslint-disable-next-line react-hooks/refs -- the suggestion callbacks read refs when Tiptap calls them on typing, not during render
      Mention.configure({
        renderText: ({ node }) => `@${String(node.attrs.id)}`,
        renderHTML: ({ options, node }) => [
          "span",
          mergeAttributes({ class: "font-medium text-primary" }, options.HTMLAttributes),
          `@${String(node.attrs.id)}`,
        ],
        suggestion: {
          char: "@",
          items: ({ query }) => filterMentionSuggestions(mentionablesRef.current, query),
          render: () => ({
            onStart: (props: SuggestionProps<Mentionable>) =>
              updateSuggestionState({ items: props.items, command: props.command }),
            onUpdate: (props: SuggestionProps<Mentionable>) =>
              updateSuggestionState({ items: props.items, command: props.command }),
            onKeyDown: handleSuggestionKeyDown,
            onExit: () => updateSuggestionState(null),
          }),
        },
      }),
    ],
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        class: EDITOR_CONTENT_CLASS_NAME,
        style: `min-height: ${rows * LINE_HEIGHT_REM}rem`,
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChangeRef.current(updatedEditor.isEmpty ? "" : serializeRichNote(updatedEditor.getJSON()));
    },
  });

  const formattingState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      isBold: currentEditor?.isActive("bold") ?? false,
      isItalic: currentEditor?.isActive("italic") ?? false,
      isBulletList: currentEditor?.isActive("bulletList") ?? false,
      isNumberedList: currentEditor?.isActive("orderedList") ?? false,
      isLink: currentEditor?.isActive("link") ?? false,
    }),
  });

  function handleClickLinkButton() {
    if (!editor) {
      return;
    }
    if (formattingState?.isLink) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    setLinkAddress("");
    setLinkError(null);
    setIsLinkFormOpen(true);
  }

  function handleSubmitLinkForm(event: FormEvent) {
    event.preventDefault();
    if (!editor) {
      return;
    }
    const typedAddress = linkAddress.trim();
    const href = toSafeHref(/^[a-z]+:/i.test(typedAddress) ? typedAddress : `https://${typedAddress}`);
    if (!typedAddress || !href) {
      setLinkError("Enter a web address, e.g. https://example.com.");
      return;
    }
    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text: typedAddress, marks: [{ type: "link", attrs: { href } }] })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setIsLinkFormOpen(false);
  }

  const toolbarButtons: ToolbarButton[] = editor
    ? [
        { label: "Bold", Icon: Bold, isActive: formattingState?.isBold ?? false, onClick: () => editor.chain().focus().toggleBold().run() },
        { label: "Italic", Icon: Italic, isActive: formattingState?.isItalic ?? false, onClick: () => editor.chain().focus().toggleItalic().run() },
        { label: "Bulleted list", Icon: List, isActive: formattingState?.isBulletList ?? false, onClick: () => editor.chain().focus().toggleBulletList().run() },
        { label: "Numbered list", Icon: ListOrdered, isActive: formattingState?.isNumberedList ?? false, onClick: () => editor.chain().focus().toggleOrderedList().run() },
        {
          label: formattingState?.isLink ? "Remove link" : "Add link",
          Icon: formattingState?.isLink ? Link2Off : Link2,
          isActive: formattingState?.isLink ?? false,
          onClick: handleClickLinkButton,
        },
      ]
    : [];

  useEffect(() => {
    mentionablesRef.current = mentionables;
    onChangeRef.current = onChange;
  }, [mentionables, onChange]);

  // A form reset (value back to "") clears the editor.
  useEffect(() => {
    if (editor && value === "" && !editor.isEmpty) {
      editor.commands.clearContent();
    }
  }, [editor, value]);

  // The field's <label for={id}> can't point at a contenteditable, so name it explicitly.
  useEffect(() => {
    const editorElement = editor?.view.dom;
    const labelElement = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`);
    if (!editorElement || !labelElement) {
      return;
    }
    labelElement.id ||= `${id}-label`;
    editorElement.setAttribute("aria-labelledby", labelElement.id);
  }, [editor, id]);

  useEffect(() => {
    editor?.view.dom.setAttribute("aria-invalid", String(Boolean(ariaInvalid)));
  }, [editor, ariaInvalid]);

  const isSuggestionListOpen = (suggestionState?.items.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          "rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30",
          ariaInvalid && "border-destructive ring-destructive/20",
        )}
      >
        <div role="toolbar" aria-label="Formatting" className="flex items-center gap-0.5 border-b px-1 py-1">
          {toolbarButtons.map((toolbarButton) => (
            <Button
              key={toolbarButton.label}
              type="button"
              variant="ghost"
              size="icon"
              className={cn("size-7", toolbarButton.isActive && "bg-accent text-accent-foreground")}
              aria-label={toolbarButton.label}
              aria-pressed={toolbarButton.isActive}
              title={toolbarButton.label}
              // Keep the editor's selection when clicking the toolbar.
              onMouseDown={(event) => event.preventDefault()}
              onClick={toolbarButton.onClick}
            >
              <toolbarButton.Icon aria-hidden />
            </Button>
          ))}
        </div>
        <EditorContent editor={editor} className="px-3 py-2 text-sm" />
      </div>

      {isLinkFormOpen && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Input
              aria-label="Link address"
              placeholder="https://example.com"
              value={linkAddress}
              onChange={(event) => {
                setLinkAddress(event.target.value);
                setLinkError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSubmitLinkForm(event);
                } else if (event.key === "Escape") {
                  event.stopPropagation();
                  setIsLinkFormOpen(false);
                }
              }}
              autoFocus
              className="h-8"
            />
            <Button type="button" size="sm" onClick={handleSubmitLinkForm}>
              <Link2 aria-hidden />
              Add link
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setIsLinkFormOpen(false)}>
              Cancel
            </Button>
          </div>
          {linkError && (
            <p role="alert" className="text-xs text-destructive">
              {linkError}
            </p>
          )}
        </div>
      )}

      {isSuggestionListOpen && suggestionState && (
        <ul
          id={suggestionListId}
          role="listbox"
          aria-label="Mention suggestions"
          className="flex flex-col rounded-md border bg-popover py-1 text-popover-foreground shadow-md"
        >
          {suggestionState.items.map((mentionable, suggestionIndex) => (
            <li
              key={mentionable.handle}
              role="option"
              aria-selected={suggestionIndex === highlightedSuggestionIndex}
              // Keep focus in the editor so the mention lands where the caret is.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSuggestion(mentionable)}
              onMouseEnter={() => highlightSuggestion(suggestionIndex)}
              className={cn(
                "flex cursor-default items-center gap-2 px-2 py-1.5 text-xs",
                suggestionIndex === highlightedSuggestionIndex && "bg-accent text-accent-foreground",
              )}
            >
              {mentionable.kind === "group" ? (
                <span className="flex size-5 items-center justify-center rounded-full bg-muted">
                  <Users aria-hidden className="size-3" />
                </span>
              ) : (
                <UserAvatar name={mentionable.label} className="size-5" />
              )}
              <span className="font-medium">@{mentionable.handle}</span>
              <span className="truncate text-muted-foreground">{mentionable.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
