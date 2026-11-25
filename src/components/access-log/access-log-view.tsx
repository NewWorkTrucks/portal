"use client";

import { Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getAccessLogRows } from "@/api/access-log";
import AccessLogFilterForm from "@/components/forms/access-log-filter-form";
import { Button } from "@/components/ui/button";
import { buildAccessLogCsv } from "@/lib/access-log-csv";
import { getTodayIsoDate } from "@/lib/kanban";
import { showRequestErrorToast } from "@/lib/toast";
import type { AccessLogFilterValues, AccessLogRow } from "@/types/access-log";

// The newest 7 calendar days, today included.
const DEFAULT_RANGE_DAY_COUNT = 6;

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "America/Chicago",
});

/** A YYYY-MM-DD date moved by a number of days. */
function shiftIsoDate(isoDate: string, dayCount: number): string {
  const shiftedDate = new Date(`${isoDate}T00:00:00Z`);
  shiftedDate.setUTCDate(shiftedDate.getUTCDate() + dayCount);
  return shiftedDate.toISOString().slice(0, 10);
}

function createDefaultFilterValues(): AccessLogFilterValues {
  const todayIsoDate = getTodayIsoDate();
  return {
    fromDate: shiftIsoDate(todayIsoDate, -DEFAULT_RANGE_DAY_COUNT),
    toDate: todayIsoDate,
    personName: "",
  };
}

/** Access log (US-9.3): the people and times the portal was used, with a CSV download. */
export default function AccessLogView() {
  const [filterValues, setFilterValues] = useState<AccessLogFilterValues>(createDefaultFilterValues);
  // The rows for the range they were loaded for; a range that hasn't loaded yet counts as loading.
  const [loadedResult, setLoadedResult] = useState<{ rangeKey: string; rows: AccessLogRow[] } | null>(null);
  const { fromDate, toDate } = filterValues;
  const rangeKey = `${fromDate}|${toDate}`;
  const isLoading = loadedResult?.rangeKey !== rangeKey;

  useEffect(() => {
    let isCancelled = false;
    const loadingRangeKey = `${fromDate}|${toDate}`;
    getAccessLogRows(fromDate, toDate)
      .then((loadedRows) => {
        if (!isCancelled) {
          setLoadedResult({ rangeKey: loadingRangeKey, rows: loadedRows });
        }
      })
      .catch((loadError: unknown) => {
        if (!isCancelled) {
          setLoadedResult({ rangeKey: loadingRangeKey, rows: [] });
          showRequestErrorToast(loadError, "load the access log");
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [fromDate, toDate]);

  const accessLogRows = useMemo(() => loadedResult?.rows ?? [], [loadedResult]);

  const personNames = useMemo(
    () => [...new Set(accessLogRows.map((accessLogRow) => accessLogRow.personName).filter(Boolean))].sort(),
    [accessLogRows],
  );

  const visibleRows = useMemo(
    () =>
      filterValues.personName
        ? accessLogRows.filter((accessLogRow) => accessLogRow.personName === filterValues.personName)
        : accessLogRows,
    [accessLogRows, filterValues.personName],
  );

  function handleSubmitFilterForm(nextFilterValues: AccessLogFilterValues) {
    setFilterValues(nextFilterValues);
  }

  function handleClickExportCsv() {
    const csvBlob = new Blob([buildAccessLogCsv(visibleRows)], { type: "text/csv;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(csvBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = `access-log-${filterValues.fromDate}-to-${filterValues.toDate}.csv`;
    downloadLink.click();
    URL.revokeObjectURL(downloadUrl);
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
      <header>
        <h1 className="text-xl font-semibold">Access log</h1>
        <p className="text-sm text-muted-foreground">
          Who used the portal, from which IP address and when. Opens on the last 7 days; pick any dates (US Central).
        </p>
      </header>

      <AccessLogFilterForm
        initialValues={filterValues}
        personNames={personNames}
        onSubmit={handleSubmitFilterForm}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading…" : `${visibleRows.length} ${visibleRows.length === 1 ? "entry" : "entries"}`}
        </p>
        <Button type="button" variant="outline" onClick={handleClickExportCsv} disabled={isLoading || visibleRows.length === 0}>
          <Download aria-hidden="true" />
          Export CSV
        </Button>
      </div>

      {!isLoading && visibleRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity in this range.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-medium">Time</th>
                <th className="py-2 pr-4 font-medium">Person</th>
                <th className="py-2 pr-4 font-medium">IP address</th>
                <th className="py-2 pr-4 font-medium">Source</th>
                <th className="py-2 pr-4 font-medium">Outcome</th>
                <th className="py-2 font-medium">Path</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((accessLogRow) => (
                <tr key={`${accessLogRow.occurredAt}-${accessLogRow.path}-${accessLogRow.source}-${accessLogRow.details.activity_id ?? ""}`} className="border-b">
                  <td className="py-2 pr-4 whitespace-nowrap">{TIME_FORMATTER.format(new Date(accessLogRow.occurredAt))}</td>
                  <td className="py-2 pr-4">{accessLogRow.personName || "Not signed in"}</td>
                  <td className="py-2 pr-4">{accessLogRow.ipAddress ?? "Unknown"}</td>
                  <td className="py-2 pr-4">{accessLogRow.source === "page" ? "Page" : "Card change"}</td>
                  <td className="py-2 pr-4">{accessLogRow.outcome === "blocked-phone" ? "Blocked (phone)" : "Allowed"}</td>
                  <td className="py-2 break-all">{accessLogRow.path}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
