"use client";

import { Users } from "lucide-react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/user-avatar";
import { filterMentionSuggestions, getActiveMentionQuery } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import type { ActiveMentionQuery, Mentionable } from "@/types/mention";

type MentionTextareaProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  mentionables: Mentionable[];
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
  "aria-invalid"?: boolean;
};

/** A textarea that suggests people and groups after typing "@", and inserts "@Handle". */
export default function MentionTextarea({
  id,
  value,
  onChange,
  mentionables,
  placeholder,
  rows = 3,
  autoFocus,
  "aria-invalid": ariaInvalid,
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Caret position to restore once an inserted mention has been rendered into the textarea.
  const pendingCaretIndexRef = useRef<number | null>(null);

  const [activeMentionQuery, setActiveMentionQuery] = useState<ActiveMentionQuery | null>(null);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(0);

  const mentionSuggestions = useMemo(
    () =>
      activeMentionQuery ? filterMentionSuggestions(mentionables, activeMentionQuery.query) : [],
    [activeMentionQuery, mentionables],
  );
  const isSuggestionListOpen = mentionSuggestions.length > 0;
  const suggestionListId = `${id}-mention-suggestions`;

  function updateActiveMentionQuery(text: string, caretIndex: number) {
    setActiveMentionQuery(getActiveMentionQuery(text, caretIndex));
    setHighlightedSuggestionIndex(0);
  }

  function handleChangeTextarea(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value);
    updateActiveMentionQuery(event.target.value, event.target.selectionStart);
  }

  function insertMention(mentionable: Mentionable) {
    const textareaElement = textareaRef.current;

    if (!activeMentionQuery || !textareaElement) {
      return;
    }

    const caretIndex = textareaElement.selectionStart;
    const insertedText = `@${mentionable.handle} `;
    const newValue =
      value.slice(0, activeMentionQuery.startIndex) + insertedText + value.slice(caretIndex);
    const newCaretIndex = activeMentionQuery.startIndex + insertedText.length;

    pendingCaretIndexRef.current = newCaretIndex;
    onChange(newValue);
    setActiveMentionQuery(null);
  }

  function handleKeyDownTextarea(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!isSuggestionListOpen) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlightedSuggestionIndex((index) => (index + 1) % mentionSuggestions.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedSuggestionIndex(
          (index) => (index - 1 + mentionSuggestions.length) % mentionSuggestions.length,
        );
        break;
      case "Enter":
      case "Tab":
        event.preventDefault();
        insertMention(mentionSuggestions[highlightedSuggestionIndex]);
        break;
      case "Escape":
        // Close the suggestions without also closing the surrounding dialog.
        event.preventDefault();
        event.stopPropagation();
        setActiveMentionQuery(null);
        break;
    }
  }

  // Runs in the same commit as the new value, before the next keystroke, so fast typing
  // right after inserting a mention can't land at a stale caret position.
  useLayoutEffect(() => {
    const textareaElement = textareaRef.current;
    const pendingCaretIndex = pendingCaretIndexRef.current;

    if (textareaElement && pendingCaretIndex !== null) {
      textareaElement.focus();
      textareaElement.setSelectionRange(pendingCaretIndex, pendingCaretIndex);
      pendingCaretIndexRef.current = null;
    }
  }, [value]);

  return (
    <div className="flex flex-col gap-1">
      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleChangeTextarea}
        onKeyDown={handleKeyDownTextarea}
        onClick={(event) =>
          updateActiveMentionQuery(event.currentTarget.value, event.currentTarget.selectionStart)
        }
        onBlur={() => setActiveMentionQuery(null)}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        aria-invalid={ariaInvalid}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isSuggestionListOpen}
        aria-controls={isSuggestionListOpen ? suggestionListId : undefined}
        aria-activedescendant={
          isSuggestionListOpen ? `${suggestionListId}-${highlightedSuggestionIndex}` : undefined
        }
      />

      {isSuggestionListOpen && (
        <ul
          id={suggestionListId}
          role="listbox"
          aria-label="Mention suggestions"
          className="flex flex-col rounded-md border bg-popover py-1 text-popover-foreground shadow-md"
        >
          {mentionSuggestions.map((mentionable, suggestionIndex) => (
            <li
              key={mentionable.handle}
              id={`${suggestionListId}-${suggestionIndex}`}
              role="option"
              aria-selected={suggestionIndex === highlightedSuggestionIndex}
              // Keep focus in the textarea so the caret position is still known on click.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insertMention(mentionable)}
              onMouseEnter={() => setHighlightedSuggestionIndex(suggestionIndex)}
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
