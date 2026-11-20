/** Reads a per-browser preference. Null when unset or when storage is blocked (private mode, disabled site data). */
export function readStoredValue(storageKey: string): string | null {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

export function writeStoredValue(storageKey: string, value: string): void {
  try {
    window.localStorage.setItem(storageKey, value);
  } catch {
    // Not saved, but the choice still applies for this visit.
  }
}
