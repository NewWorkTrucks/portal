"use client";

import { useEffect, useState } from "react";
import { canViewAccessLog } from "@/api/access-log";
import { useDataMode } from "@/components/data-mode-provider";

/** Whether the signed-in person sees the access log link (US-9.3). Live mode only; starts as no. */
export function useCanViewAccessLog(): boolean {
  const { dataMode } = useDataMode();

  const [canView, setCanView] = useState(false);

  useEffect(() => {
    if (dataMode !== "live") {
      return;
    }
    let isCancelled = false;
    canViewAccessLog().then((allowed) => {
      if (!isCancelled) {
        setCanView(allowed);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [dataMode]);

  return canView && dataMode === "live";
}
