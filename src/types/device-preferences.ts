/** Which cards the board shows (G13, US-3.6). Members always see only their own work. */
export type BoardCardScope = "mine" | "all";

/** Whether the board shows the business picked in the header, or every business you belong to. */
export type BoardBusinessScope = "current" | "all";

/** Preferences saved in this browser only, because they depend on the device (or are personal habits per device). */
export type DevicePreferences = {
  /** Turns off animations, transitions and blur for slower devices. */
  isLowSpecModeOn: boolean;
  /** Hides the Done column on the board. */
  isDoneColumnHidden: boolean;
  /** Business to open by default; null opens the first one. */
  defaultBusinessId: string | null;
  /** Heads and admins only; members are always on "mine". */
  boardCardScope: BoardCardScope;
  /** Heads and admins only; members always see the current business. */
  boardBusinessScope: BoardBusinessScope;
};

export type DevicePreferencesContextValue = DevicePreferences & {
  setLowSpecMode: (isLowSpecModeOn: boolean) => void;
  setDoneColumnHidden: (isDoneColumnHidden: boolean) => void;
  setDefaultBusinessId: (defaultBusinessId: string | null) => void;
  setBoardCardScope: (boardCardScope: BoardCardScope) => void;
  setBoardBusinessScope: (boardBusinessScope: BoardBusinessScope) => void;
};
