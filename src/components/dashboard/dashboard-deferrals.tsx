import Link from "next/link";
import DashboardPanel, { DashboardStatTile } from "@/components/dashboard/dashboard-panel";
import { getTaskBoardHref } from "@/lib/dashboard";
import { formatAuditLogTimestamp } from "@/lib/kanban-audit-log";
import { getColumnTitle } from "@/lib/kanban";
import type { DashboardDeferralsProps } from "@/types/dashboard";

/** Cards stuck or deferred now, cards that keep getting deferred, and why cards were deferred. */
export default function DashboardDeferrals({ deferrals }: DashboardDeferralsProps) {
  return (
    <DashboardPanel title="Stuck and deferred" description="What's blocked or postponed, and why.">
      <dl className="grid grid-cols-2 gap-2">
        <DashboardStatTile label="Stuck now" value={String(deferrals.stuckCount)} />
        <DashboardStatTile label="Deferred now" value={String(deferrals.deferredCount)} />
      </dl>

      <section aria-labelledby="repeat-deferrals" className="flex flex-col gap-1.5">
        <h3 id="repeat-deferrals" className="text-xs text-muted-foreground">Deferred two or more times</h3>
        {deferrals.repeatDeferred.length === 0 ? (
          <p className="text-sm text-muted-foreground">No card has been deferred more than once.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-md border">
            {deferrals.repeatDeferred.map((repeatDeferral) => (
              <li key={repeatDeferral.taskId}>
                <Link
                  href={getTaskBoardHref(repeatDeferral.taskId)}
                  className="flex min-h-11 items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{repeatDeferral.title}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {repeatDeferral.ownerName} · {getColumnTitle(repeatDeferral.status)}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-medium tabular-nums">{repeatDeferral.deferralCount} times</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recent-deferral-reasons" className="flex flex-col gap-1.5">
        <h3 id="recent-deferral-reasons" className="text-xs text-muted-foreground">Latest deferral reasons</h3>
        {deferrals.recentReasons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deferrals yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {deferrals.recentReasons.map((deferralReason) => (
              <li key={`${deferralReason.taskId}-${deferralReason.occurredAt}`} className="flex flex-col gap-0.5 rounded-md bg-muted/60 px-3 py-2 text-sm">
                <span className="line-clamp-3 break-words">{deferralReason.reason}</span>
                <span className="truncate text-xs text-muted-foreground">
                  <Link href={getTaskBoardHref(deferralReason.taskId)} className="underline-offset-2 hover:underline">
                    {deferralReason.title}
                  </Link>{" "}
                  · {deferralReason.ownerName} · {formatAuditLogTimestamp(deferralReason.occurredAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardPanel>
  );
}
