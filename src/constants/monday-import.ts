import type { MondayImportStatus } from "@/types/monday-import";

export const MAX_MONDAY_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_MONDAY_UNCOMPRESSED_BYTES = 50 * 1024 * 1024;
/** Matches the database limit, which keeps an import inside the 8-second request limit. */
export const MAX_MONDAY_IMPORT_ITEMS = 2000;

export const MONDAY_STATUS_TO_KANBAN_STATUS: Record<string, MondayImportStatus> = {
  "": "not-started",
  "not started": "not-started",
  "working on it": "working-on-it",
  "needs review": "needs-review",
  deferred: "deferred",
  done: "done",
};

/** These stages require details the export doesn't contain, so the cards stay active for follow-up. */
export const MONDAY_STATUSES_NEEDING_DETAILS = ["waiting", "stuck"];

export const MONDAY_IMPORT_STATUS_LABELS: Record<MondayImportStatus, string> = {
  "not-started": "Not Started",
  "working-on-it": "Working on It",
  "needs-review": "Needs Review",
  deferred: "Deferred",
  done: "Done",
};
