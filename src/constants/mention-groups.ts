/** Automatic Stuck and can't-start alerts go to this group, so it can't be deleted (see the database). */
export const LEADERSHIP_GROUP_HANDLE = "Leadership";

/** Same rule as the database: a letter, then letters, digits, _ or -. */
export const MENTION_HANDLE_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;
