/** Preferences saved in this browser only, because they depend on the device (or are personal habits per device). */
export type DevicePreferences = {
  /** Turns off animations, transitions, blur and the target cursor for slower devices. */
  isLowSpecModeOn: boolean;
  /** The target cursor on Kanban cards. Only shown while low spec mode is off. */
  isTargetCursorOn: boolean;
  /** Hides the Done column on the board. */
  isDoneColumnHidden: boolean;
  /** Business to open by default; null opens the first one. */
  defaultBusinessId: string | null;
};

export type DevicePreferencesContextValue = DevicePreferences & {
  /** Whether the target cursor should actually show: turned on, low spec off, and a mouse or trackpad. */
  isTargetCursorActive: boolean;
  setLowSpecMode: (isLowSpecModeOn: boolean) => void;
  setTargetCursor: (isTargetCursorOn: boolean) => void;
  setDoneColumnHidden: (isDoneColumnHidden: boolean) => void;
  setDefaultBusinessId: (defaultBusinessId: string | null) => void;
};
