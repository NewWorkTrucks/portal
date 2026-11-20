/** Preferences saved in this browser only, because they depend on the device (or are personal habits per device). */
export type DevicePreferences = {
  /** Turns off animations, transitions and blur for slower devices. */
  isLowSpecModeOn: boolean;
  /** Hides the Done column on the board. */
  isDoneColumnHidden: boolean;
  /** Business to open by default; null opens the first one. */
  defaultBusinessId: string | null;
};

export type DevicePreferencesContextValue = DevicePreferences & {
  setLowSpecMode: (isLowSpecModeOn: boolean) => void;
  setDoneColumnHidden: (isDoneColumnHidden: boolean) => void;
  setDefaultBusinessId: (defaultBusinessId: string | null) => void;
};
