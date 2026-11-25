"use client";

import { useEffect, useState } from "react";
import { canViewAccessLog } from "@/api/access-log";

/** Whether the signed-in person sees the access log link (US-9.3). Starts as no, then checks once. */
export function useCanViewAccessLog(): boolean {
  const [canView, setCanView] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    canViewAccessLog().then((allowed) => {
      if (!isCancelled) {
        setCanView(allowed);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  return canView;
}
