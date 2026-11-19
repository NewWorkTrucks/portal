/** E1-4: Supabase Storage limit per file. */
export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024;

/** How many files one update, daily update or stage move can carry. Matches the database. */
export const MAX_FILES_PER_UPDATE = 10;
