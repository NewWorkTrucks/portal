import type { AccessLogRow } from "@/types/access-log";

const CSV_HEADERS = ["Time (US Central)", "Person", "IP address", "Source", "Outcome", "Method", "Path", "User agent", "Details"];

/** One CSV cell: quoted when it holds a comma, quote or line break; quotes doubled. */
function escapeCsvCell(cellValue: string): string {
  return /[",\r\n]/.test(cellValue) ? `"${cellValue.replace(/"/g, '""')}"` : cellValue;
}

/** The rows as CSV text for a report download (US-9.3 export). */
export function buildAccessLogCsv(accessLogRows: AccessLogRow[]): string {
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Chicago",
  });

  const lines = accessLogRows.map((accessLogRow) =>
    [
      timeFormatter.format(new Date(accessLogRow.occurredAt)),
      accessLogRow.personName,
      accessLogRow.ipAddress ?? "",
      accessLogRow.source,
      accessLogRow.outcome,
      accessLogRow.method,
      accessLogRow.path,
      accessLogRow.userAgent,
      JSON.stringify(accessLogRow.details),
    ]
      .map(escapeCsvCell)
      .join(","),
  );

  return [CSV_HEADERS.join(","), ...lines].join("\r\n");
}
