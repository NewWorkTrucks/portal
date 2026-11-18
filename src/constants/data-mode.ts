import type { DataMode } from "@/types/data-mode";

const configuredDataMode = process.env.NEXT_PUBLIC_DATA_MODE;

/** From NEXT_PUBLIC_DATA_MODE; anything other than "live" means mock data. */
export const DEFAULT_DATA_MODE: DataMode = configuredDataMode === "live" ? "live" : "mock";

/** Development-only override set by the header toggle. */
export const DATA_MODE_STORAGE_KEY = "ffl-data-mode";

export const DATA_MODE_OPTIONS: { value: DataMode; label: string; description: string }[] = [
  { value: "mock", label: "Mock", description: "Sample data in this browser" },
  { value: "live", label: "Live", description: "Supabase (NWT-Main)" },
];
