import type { DataMode } from "@/types/data-mode";

const configuredDataMode = process.env.NEXT_PUBLIC_DATA_MODE;

/**
 * Production builds always use live data, so a deployment can never show the sample board
 * without sign-in. Otherwise from NEXT_PUBLIC_DATA_MODE; anything other than "live" means mock.
 */
export const DEFAULT_DATA_MODE: DataMode =
  process.env.NODE_ENV === "production" || configuredDataMode === "live" ? "live" : "mock";

/** Development-only override set by the header toggle. */
export const DATA_MODE_STORAGE_KEY = "ffl-data-mode";

export const DATA_MODE_OPTIONS: { value: DataMode; label: string; description: string }[] = [
  { value: "mock", label: "Mock", description: "Sample data in this browser" },
  { value: "live", label: "Live", description: "Supabase" },
];
