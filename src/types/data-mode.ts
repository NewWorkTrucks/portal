export type DataMode = "mock" | "live";

export type DataModeContextValue = {
  dataMode: DataMode;
  /** Development only: switch data source for this browser. */
  setDataMode: (dataMode: DataMode) => void;
};
