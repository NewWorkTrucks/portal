"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import {
  BOARD_BUSINESS_SCOPE_STORAGE_KEY,
  BOARD_CARD_SCOPE_STORAGE_KEY,
  DEFAULT_BUSINESS_STORAGE_KEY,
  DONE_COLUMN_HIDDEN_STORAGE_KEY,
  LOW_SPEC_MODE_ATTRIBUTE,
  LOW_SPEC_MODE_STORAGE_KEY,
  REDUCED_MOTION_QUERY,
} from "@/constants/device-preferences";
import { readStoredValue, writeStoredValue } from "@/lib/browser-storage";
import type {
  BoardBusinessScope,
  BoardCardScope,
  DevicePreferences,
  DevicePreferencesContextValue,
} from "@/types/device-preferences";

const DevicePreferencesContext = createContext<DevicePreferencesContextValue | null>(null);

const DEFAULT_DEVICE_PREFERENCES: DevicePreferences = {
  isLowSpecModeOn: false,
  isDoneColumnHidden: false,
  defaultBusinessId: null,
  boardCardScope: "all",
  boardBusinessScope: "current",
};

function readStoredBoolean(storageKey: string, fallback: boolean): boolean {
  const storedValue = readStoredValue(storageKey);
  return storedValue === null ? fallback : storedValue === "true";
}

function applyLowSpecMode(isLowSpecModeOn: boolean) {
  document.documentElement.toggleAttribute(LOW_SPEC_MODE_ATTRIBUTE, isLowSpecModeOn);
}

type DevicePreferencesProviderProps = {
  children: ReactNode;
};

/** Low spec mode and board preferences, saved per browser. */
export function DevicePreferencesProvider({ children }: DevicePreferencesProviderProps) {
  // Defaults on the server; the stored choices are read after hydration.
  const [devicePreferences, setDevicePreferences] = useState<DevicePreferences>(DEFAULT_DEVICE_PREFERENCES);

  function updateDevicePreference<PreferenceName extends keyof DevicePreferences>(
    preferenceName: PreferenceName,
    preferenceValue: DevicePreferences[PreferenceName],
    storageKey: string,
  ) {
    setDevicePreferences((previousPreferences) => ({ ...previousPreferences, [preferenceName]: preferenceValue }));
    writeStoredValue(storageKey, String(preferenceValue ?? ""));
  }

  function setLowSpecMode(isLowSpecModeOn: boolean) {
    updateDevicePreference("isLowSpecModeOn", isLowSpecModeOn, LOW_SPEC_MODE_STORAGE_KEY);
    applyLowSpecMode(isLowSpecModeOn);
  }

  function setDoneColumnHidden(isDoneColumnHidden: boolean) {
    updateDevicePreference("isDoneColumnHidden", isDoneColumnHidden, DONE_COLUMN_HIDDEN_STORAGE_KEY);
  }

  function setDefaultBusinessId(defaultBusinessId: string | null) {
    updateDevicePreference("defaultBusinessId", defaultBusinessId, DEFAULT_BUSINESS_STORAGE_KEY);
  }

  function setBoardCardScope(boardCardScope: BoardCardScope) {
    updateDevicePreference("boardCardScope", boardCardScope, BOARD_CARD_SCOPE_STORAGE_KEY);
  }

  function setBoardBusinessScope(boardBusinessScope: BoardBusinessScope) {
    updateDevicePreference("boardBusinessScope", boardBusinessScope, BOARD_BUSINESS_SCOPE_STORAGE_KEY);
  }

  useEffect(() => {
    // One-time read of browser-only storage. Low spec mode starts on when the system asks for
    // reduced motion, until the person picks for themselves.
    const isStoredLowSpecModeOn = readStoredBoolean(
      LOW_SPEC_MODE_STORAGE_KEY,
      window.matchMedia(REDUCED_MOTION_QUERY).matches,
    );
    applyLowSpecMode(isStoredLowSpecModeOn);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of browser-only storage
    setDevicePreferences({
      isLowSpecModeOn: isStoredLowSpecModeOn,
      isDoneColumnHidden: readStoredBoolean(DONE_COLUMN_HIDDEN_STORAGE_KEY, false),
      defaultBusinessId: readStoredValue(DEFAULT_BUSINESS_STORAGE_KEY) || null,
      boardCardScope: readStoredValue(BOARD_CARD_SCOPE_STORAGE_KEY) === "mine" ? "mine" : "all",
      boardBusinessScope: readStoredValue(BOARD_BUSINESS_SCOPE_STORAGE_KEY) === "all" ? "all" : "current",
    });
  }, []);

  return (
    <DevicePreferencesContext.Provider
      value={{
        ...devicePreferences,
        setLowSpecMode,
        setDoneColumnHidden,
        setDefaultBusinessId,
        setBoardCardScope,
        setBoardBusinessScope,
      }}
    >
      {children}
    </DevicePreferencesContext.Provider>
  );
}

export function useDevicePreferences(): DevicePreferencesContextValue {
  const devicePreferencesContext = useContext(DevicePreferencesContext);

  if (!devicePreferencesContext) {
    throw new Error("useDevicePreferences must be used inside <DevicePreferencesProvider>.");
  }

  return devicePreferencesContext;
}
