"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import {
  ACCENT_COLOR_STORAGE_KEY,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_THEME_MODE,
  THEME_MODE_STORAGE_KEY,
} from "@/constants/theme";
import {
  applyThemeToDocument,
  readStoredAccentColor,
  readStoredThemeMode,
  subscribeToColorSchemeChanges,
  writeStoredValue,
} from "@/lib/theme";
import type { AccentColor, ThemeContextValue, ThemeMode } from "@/types/theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
};

/** Light/dark/system mode and the accent color, saved per browser. */
export function ThemeProvider({ children }: ThemeProviderProps) {
  // Defaults on the server; the stored choice is read after hydration (the <head> script
  // has already painted it, so nothing visible changes).
  const [themeMode, setThemeModeState] = useState<ThemeMode>(DEFAULT_THEME_MODE);
  const [accentColor, setAccentColorState] = useState<AccentColor>(DEFAULT_ACCENT_COLOR);

  function setThemeMode(newThemeMode: ThemeMode) {
    setThemeModeState(newThemeMode);
    writeStoredValue(THEME_MODE_STORAGE_KEY, newThemeMode);
    applyThemeToDocument(newThemeMode, accentColor);
  }

  function setAccentColor(newAccentColor: AccentColor) {
    setAccentColorState(newAccentColor);
    writeStoredValue(ACCENT_COLOR_STORAGE_KEY, newAccentColor);
    applyThemeToDocument(themeMode, newAccentColor);
  }

  useEffect(() => {
    // Sync with what the <head> script applied from storage.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of browser-only storage
    setThemeModeState(readStoredThemeMode());
    setAccentColorState(readStoredAccentColor());
  }, []);

  useEffect(() => {
    if (themeMode !== "system") {
      return;
    }

    // Follow the operating system while in System mode.
    return subscribeToColorSchemeChanges(() => applyThemeToDocument("system", accentColor));
  }, [themeMode, accentColor]);

  return (
    <ThemeContext.Provider value={{ themeMode, accentColor, setThemeMode, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    throw new Error("useTheme must be used inside <ThemeProvider>.");
  }

  return themeContext;
}
