/**
 * The most a person can type in one note field. Some forms combine up to three fields into one
 * stored note, so this stays well under the database's 10,000-character limit on a stored note
 * (kanban_private.require_note).
 */
export const MAX_NOTE_FIELD_LENGTH = 3_000;
