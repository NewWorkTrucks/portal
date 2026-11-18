import { type LucideIcon, Monitor, Moon, Sun } from "lucide-react";
import type { AccentColor, ThemeMode } from "@/types/theme";

export const DEFAULT_THEME_MODE: ThemeMode = "system";
export const DEFAULT_ACCENT_COLOR: AccentColor = "emerald";

// Per-browser preference. TODO: Save to the user's profile once accounts exist, so it follows them.
export const THEME_MODE_STORAGE_KEY = "ffl-theme-mode";
export const ACCENT_COLOR_STORAGE_KEY = "ffl-accent-color";

export const THEME_MODE_OPTIONS: { value: ThemeMode; label: string; Icon: LucideIcon }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

/** Swatch classes match the light-mode primary of each palette in globals.css. */
export const ACCENT_COLOR_OPTIONS: { value: AccentColor; label: string; swatchClassName: string }[] = [
  { value: "emerald", label: "Emerald", swatchClassName: "bg-emerald-600" },
  { value: "blue", label: "Blue", swatchClassName: "bg-blue-600" },
  { value: "violet", label: "Violet", swatchClassName: "bg-violet-600" },
  { value: "rose", label: "Rose", swatchClassName: "bg-rose-600" },
  { value: "orange", label: "Orange", swatchClassName: "bg-orange-700" },
  { value: "slate", label: "Slate", swatchClassName: "bg-slate-800" },
];
