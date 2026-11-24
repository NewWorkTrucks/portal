import Link from "next/link";
import DashboardPanel from "@/components/dashboard/dashboard-panel";
import { formatWorkday, getTaskBoardHref } from "@/lib/dashboard";
import type { DashboardComplianceProps } from "@/types/dashboard";

const HEALTH_LABELS = [
  { key: "onTrack", label: "On track", className: "bg-emerald-500" },
  { key: "atRisk", label: "At risk", className: "bg-amber-500" },
  { key: "offTrack", label: "Off track", className: "bg-red-500" },
  { key: "noUpdate", label: "No update yet", className: "bg-muted-foreground/40" },
] as const;

/** Whether Working on It cards got their daily update by 6 PM Central, and how they're going. */
export default function DashboardCompliance({ compliance }: DashboardComplianceProps) {
  const largestExpectedCount = Math.max(1, ...compliance.byWorkday.map((workdayCompliance) => workdayCompliance.expectedCount));

  return (
    <DashboardPanel
      title="Daily update compliance"
      description="Working on It cards updated by 6 PM Central, for the last 10 workdays."
    >
      <section aria-labelledby="update-health" className="flex flex-col gap-1.5">
        <h3 id="update-health" className="text-xs text-muted-foreground">Health from the latest daily update</h3>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {HEALTH_LABELS.map((healthLabel) => (
            <li key={healthLabel.key} className="flex items-center gap-1.5">
              <span aria-hidden className={`size-2 rounded-full ${healthLabel.className}`} />
              {healthLabel.label}
              <span className="font-medium tabular-nums">{compliance.health[healthLabel.key]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="missed-latest" className="flex flex-col gap-1.5">
        <h3 id="missed-latest" className="text-xs text-muted-foreground">
          Missed on {formatWorkday(compliance.latestWorkday)}
        </h3>
        {compliance.missedOnLatestWorkday.length === 0 ? (
          <p className="text-sm text-muted-foreground">Every card was updated.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-md border">
            {compliance.missedOnLatestWorkday.map((missedCard) => (
              <li key={missedCard.taskId}>
                <Link
                  href={getTaskBoardHref(missedCard.taskId)}
                  className="flex min-h-11 flex-col justify-center px-3 py-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="truncate font-medium">{missedCard.title}</span>
                  <span className="truncate text-xs text-muted-foreground">{missedCard.ownerName}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="updates-by-workday" className="flex flex-col gap-1.5">
        <h3 id="updates-by-workday" className="text-xs text-muted-foreground">Updated by workday</h3>
        <ul className="flex flex-col gap-1.5">
          {compliance.byWorkday.map((workdayCompliance) => {
            const updatedCount = workdayCompliance.expectedCount - workdayCompliance.missedCount;
            return (
              <li key={workdayCompliance.workday} className="grid grid-cols-[6.5rem_minmax(0,1fr)_5.5rem] items-center gap-2 text-sm">
                <span className="truncate text-muted-foreground">{formatWorkday(workdayCompliance.workday)}</span>
                <span aria-hidden className="flex h-2 overflow-hidden rounded-full bg-muted">
                  <span className="h-full bg-primary" style={{ width: `${(updatedCount / largestExpectedCount) * 100}%` }} />
                  <span
                    className="h-full bg-amber-500"
                    style={{ width: `${(workdayCompliance.missedCount / largestExpectedCount) * 100}%` }}
                  />
                </span>
                <span className="text-right whitespace-nowrap tabular-nums">
                  {workdayCompliance.expectedCount === 0 ? "None due" : `${updatedCount} of ${workdayCompliance.expectedCount}`}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </DashboardPanel>
  );
}
