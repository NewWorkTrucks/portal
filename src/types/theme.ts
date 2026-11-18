export type ThemeMode = "light" | "dark" | "system";

export type AccentColor = "emerald" | "blue" | "violet" | "rose" | "orange" | "slate";

export type ThemeContextValue = {
  themeMode: ThemeMode;
  accentColor: AccentColor;
  setThemeMode: (themeMode: ThemeMode) => void;
  setAccentColor: (accentColor: AccentColor) => void;
};
