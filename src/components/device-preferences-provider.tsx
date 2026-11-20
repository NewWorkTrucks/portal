"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import {
  DEFAULT_BUSINESS_STORAGE_KEY,
  DONE_COLUMN_HIDDEN_STORAGE_KEY,
  FINE_POINTER_QUERY,
  LOW_SPEC_MODE_ATTRIBUTE,
  LOW_SPEC_MODE_STORAGE_KEY,
  REDUCED_MOTION_QUERY,
  TARGET_CURSOR_STORAGE_KEY,
} from "@/constants/device-preferences";
import { readStoredValue, writeStoredValue } from "@/lib/browser-storage";
import type { DevicePreferences, DevicePreferencesContextValue } from "@/types/device-preferences";

const DevicePreferencesContext = createContext<DevicePreferencesContextValue | null>(null);

const DEFAULT_DEVICE_PREFERENCES: DevicePreferences = {
  isLowSpecModeOn: false,
  isTargetCursorOn: false,
  isDoneColumnHidden: false,
  defaultBusinessId: null,
};

function readStoredBoolean(storageKey: string, fallback: boolean): boolean {
  const storedValue = readStoredValue(storageKey);
  return storedValue === null ? fallback : storedValue === "true";
}

type DevicePreferencesProviderProps = {
  children: ReactNode;
};

/** Low spec mode, the target cursor and board preferences, saved per browser. */
export function DevicePreferencesProvider({ children }: DevicePreferencesProviderProps) {
  // Defaults on the server; the stored choices are read after hydration.
  const [devicePreferences, setDevicePreferences] = useState<DevicePreferences>(DEFAULT_DEVICE_PREFERENCES);
  const [hasFinePointer, setHasFinePointer] = useState(false);

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
  }

  function setTargetCursor(isTargetCursorOn: boolean) {
    updateDevicePreference("isTargetCursorOn", isTargetCursorOn, TARGET_CURSOR_STORAGE_KEY);
  }

  function setDoneColumnHidden(isDoneColumnHidden: boolean) {
    updateDevicePreference("isDoneColumnHidden", isDoneColumnHidden, DONE_COLUMN_HIDDEN_STORAGE_KEY);
  }

  function setDefaultBusinessId(defaultBusinessId: string | null) {
    updateDevicePreference("defaultBusinessId", defaultBusinessId, DEFAULT_BUSINESS_STORAGE_KEY);
  }

  useEffect(() => {
    // One-time read of browser-only storage. Low spec mode starts on when the system asks for
    // reduced motion, until the person picks for themselves.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of browser-only storage
    setDevicePreferences({
      isLowSpecModeOn: readStoredBoolean(
        LOW_SPEC_MODE_STORAGE_KEY,
        window.matchMedia(REDUCED_MOTION_QUERY).matches,
      ),
      isTargetCursorOn: readStoredBoolean(TARGET_CURSOR_STORAGE_KEY, false),
      isDoneColumnHidden: readStoredBoolean(DONE_COLUMN_HIDDEN_STORAGE_KEY, false),
      defaultBusinessId: readStoredValue(DEFAULT_BUSINESS_STORAGE_KEY) || null,
    });
    setHasFinePointer(window.matchMedia(FINE_POINTER_QUERY).matches);
  }, []);

  useEffect(() => {
    document.documentElement.toggleAttribute(LOW_SPEC_MODE_ATTRIBUTE, devicePreferences.isLowSpecModeOn);
  }, [devicePreferences.isLowSpecModeOn]);

  return (
    <DevicePreferencesContext.Provider
      value={{
        ...devicePreferences,
        isTargetCursorActive:
          devicePreferences.isTargetCursorOn && !devicePreferences.isLowSpecModeOn && hasFinePointer,
        setLowSpecMode,
        setTargetCursor,
        setDoneColumnHidden,
        setDefaultBusinessId,
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
