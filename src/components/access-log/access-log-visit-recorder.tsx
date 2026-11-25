"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { recordPageVisit } from "@/api/access-log";
import { useDataMode } from "@/components/data-mode-provider";

/**
 * Records each in-app page change in the access log (US-9.3). The first page is skipped because the
 * proxy already logged it as a full page load. Live mode only. Renders nothing.
 */
export default function AccessLogVisitRecorder() {
  const pathname = usePathname();
  const { dataMode } = useDataMode();

  const lastRecordedPathname = useRef(pathname);

  useEffect(() => {
    if (pathname === lastRecordedPathname.current) {
      return;
    }
    lastRecordedPathname.current = pathname;
    if (dataMode === "live") {
      void recordPageVisit(pathname);
    }
  }, [pathname, dataMode]);

  return null;
}
