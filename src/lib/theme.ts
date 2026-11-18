import {
  ACCENT_COLOR_OPTIONS,
  ACCENT_COLOR_STORAGE_KEY,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_THEME_MODE,
  THEME_MODE_OPTIONS,
  THEME_MODE_STORAGE_KEY,
} from "@/constants/theme";
import type { AccentColor, ThemeMode } from "@/types/theme";

const DARK_COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

export function isThemeMode(value: unknown): value is ThemeMode {
  return THEME_MODE_OPTIONS.some((option) => option.value === value);
}

export function isAccentColor(value: unknown): value is AccentColor {
  return ACCENT_COLOR_OPTIONS.some((option) => option.value === value);
}

function readStoredValue(storageKey: string): string | null {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    // Storage can be blocked (private mode, disabled site data); fall back to defaults.
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

export function readStoredThemeMode(): ThemeMode {
  const storedThemeMode = readStoredValue(THEME_MODE_STORAGE_KEY);
  return isThemeMode(storedThemeMode) ? storedThemeMode : DEFAULT_THEME_MODE;
}

export function readStoredAccentColor(): AccentColor {
  const storedAccentColor = readStoredValue(ACCENT_COLOR_STORAGE_KEY);
  return isAccentColor(storedAccentColor) ? storedAccentColor : DEFAULT_ACCENT_COLOR;
}

export function prefersDarkColorScheme(): boolean {
  return window.matchMedia(DARK_COLOR_SCHEME_QUERY).matches;
}

export function subscribeToColorSchemeChanges(onChange: () => void): () => void {
  const mediaQueryList = window.matchMedia(DARK_COLOR_SCHEME_QUERY);
  mediaQueryList.addEventListener("change", onChange);
  return () => mediaQueryList.removeEventListener("change", onChange);
}

/** Puts the theme on <html>: the `dark` class, the accent attribute, and native control colors. */
export function applyThemeToDocument(themeMode: ThemeMode, accentColor: AccentColor): void {
  const isDark = themeMode === "dark" || (themeMode === "system" && prefersDarkColorScheme());
  const rootElement = document.documentElement;

  rootElement.classList.toggle("dark", isDark);
  rootElement.dataset.accent = accentColor;
  rootElement.style.colorScheme = isDark ? "dark" : "light";
}

/**
 * Runs in <head> while the HTML is parsed, before first paint, so a saved dark theme never flashes light.
 * It mirrors applyThemeToDocument with the same storage keys and defaults.
 */
export function buildThemeInitScript(): string {
  const themeModes = JSON.stringify(THEME_MODE_OPTIONS.map((option) => option.value));
  const accentColors = JSON.stringify(ACCENT_COLOR_OPTIONS.map((option) => option.value));

  return `(function(){try{var s=window.localStorage,m=s.getItem(${JSON.stringify(THEME_MODE_STORAGE_KEY)}),a=s.getItem(${JSON.stringify(ACCENT_COLOR_STORAGE_KEY)});if(${themeModes}.indexOf(m)<0)m=${JSON.stringify(DEFAULT_THEME_MODE)};if(${accentColors}.indexOf(a)<0)a=${JSON.stringify(DEFAULT_ACCENT_COLOR)};var d=m==="dark"||(m==="system"&&window.matchMedia(${JSON.stringify(DARK_COLOR_SCHEME_QUERY)}).matches),r=document.documentElement;r.classList.toggle("dark",d);r.dataset.accent=a;r.style.colorScheme=d?"dark":"light"}catch(e){}})()`;
}
