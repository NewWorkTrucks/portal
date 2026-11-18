"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { DATA_MODE_STORAGE_KEY, DEFAULT_DATA_MODE } from "@/constants/data-mode";
import { IS_USER_SIMULATION_ENABLED } from "@/constants/feature-flags";
import type { DataMode, DataModeContextValue } from "@/types/data-mode";

const DataModeContext = createContext<DataModeContextValue | null>(null);

type DataModeProviderProps = {
  children: ReactNode;
};

function readStoredDataMode(): DataMode | null {
  try {
    const storedDataMode = window.localStorage.getItem(DATA_MODE_STORAGE_KEY);
    return storedDataMode === "mock" || storedDataMode === "live" ? storedDataMode : null;
  } catch {
    return null;
  }
}

/**
 * Whether the portal reads sample data (mock) or Supabase (live). The env variable sets the
 * default; in development the header toggle can override it for this browser. Children are
 * keyed by mode, so switching remounts the data providers with fresh state.
 */
export function DataModeProvider({ children }: DataModeProviderProps) {
  const [dataMode, setDataModeState] = useState<DataMode>(DEFAULT_DATA_MODE);

  function setDataMode(newDataMode: DataMode) {
    if (!IS_USER_SIMULATION_ENABLED) {
      return;
    }
    try {
      window.localStorage.setItem(DATA_MODE_STORAGE_KEY, newDataMode);
    } catch {
      // Not saved; still applies until reload.
    }
    setDataModeState(newDataMode);
  }

  useEffect(() => {
    if (!IS_USER_SIMULATION_ENABLED) {
      return;
    }
    const storedDataMode = readStoredDataMode();
    if (storedDataMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only override
      setDataModeState(storedDataMode);
    }
  }, []);

  return (
    <DataModeContext.Provider value={{ dataMode, setDataMode }}>
      <DataModeKeyedChildren dataMode={dataMode}>{children}</DataModeKeyedChildren>
    </DataModeContext.Provider>
  );
}

function DataModeKeyedChildren({ dataMode, children }: { dataMode: DataMode; children: ReactNode }) {
  return <div key={dataMode} className="contents">{children}</div>;
}

export function useDataMode(): DataModeContextValue {
  const dataModeContext = useContext(DataModeContext);

  if (!dataModeContext) {
    throw new Error("useDataMode must be used inside <DataModeProvider>.");
  }

  return dataModeContext;
}
