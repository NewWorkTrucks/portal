import AccessLogView from "@/components/access-log/access-log-view";

/** Access log (US-9.3). Only people on the viewer list get data; the database enforces that. */
export default function AccessLogPage() {
  return <AccessLogView />;
}
