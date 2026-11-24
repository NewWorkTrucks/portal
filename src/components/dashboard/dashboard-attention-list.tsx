import { CircleCheck } from "lucide-react";
import Link from "next/link";
import DashboardPanel from "@/components/dashboard/dashboard-panel";
import { DASHBOARD_ATTENTION_REASON_DISPLAY, DASHBOARD_ATTENTION_REASON_ORDER } from "@/constants/dashboard";
import { formatElapsedSince, getTaskBoardHref } from "@/lib/dashboard";
import { formatKanbanDate } from "@/lib/kanban";
import type {
  DashboardAttentionItem,
  DashboardAttentionListProps,
  DashboardAttentionReason,
} from "@/types/dashboard";

function describeAttentionItem(attentionItem: DashboardAttentionItem, generatedAt: string): string {
  const elapsed = formatElapsedSince(attentionItem.since, generatedAt);
  switch (attentionItem.reason) {
    case "missed-update":
      return `Missed ${formatKanbanDate(attentionItem.detail)}`;
    case "overdue":
      return `Due ${formatKanbanDate(attentionItem.detail)}`;
    case "review-over-limit":
      return attentionItem.detail ? `${elapsed} with ${attentionItem.detail}` : `${elapsed} in review`;
    default:
      return `For ${elapsed}`;
  }
}

/** Cards Leadership should act on now, grouped by why. Each opens on the board. */
export default function DashboardAttentionList({
  attention,
  reviewLimitHours,
  notStartedLimitHours,
  generatedAt,
}: DashboardAttentionListProps) {
  const limitHoursByReason: Partial<Record<DashboardAttentionReason, number>> = {
    "review-over-limit": reviewLimitHours,
    "not-started-over-limit": notStartedLimitHours,
  };
  const attentionGroups = DASHBOARD_ATTENTION_REASON_ORDER.map((reason) => ({
    reason,
    items: attention.filter((attentionItem) => attentionItem.reason === reason),
  })).filter((attentionGroup) => attentionGroup.items.length > 0);

  return (
    <DashboardPanel
      title="Needs attention now"
      description="Stuck, late or overdue cards. Open one to act on it."
      className="lg:col-span-2"
    >
      {attentionGroups.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleCheck aria-hidden className="size-4 text-primary" />
          Nothing needs attention right now.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {attentionGroups.map(({ reason, items }) => {
            const { label, Icon, isProvisional } = DASHBOARD_ATTENTION_REASON_DISPLAY[reason];
            const limitHours = limitHoursByReason[reason];

            return (
              <section key={reason} aria-labelledby={`attention-${reason}`} className="flex min-w-0 flex-col gap-2">
                <h3 id={`attention-${reason}`} className="flex items-center gap-1.5 text-sm font-medium">
                  <Icon aria-hidden className="size-4 text-muted-foreground" />
                  {label}
                  <span className="text-muted-foreground tabular-nums">({items.length})</span>
                </h3>
                {limitHours !== undefined && (
                  <p className="-mt-1 text-xs text-muted-foreground">
                    Over {limitHours} hours{isProvisional && ", provisional limit"}
                  </p>
                )}
                <ul className="flex flex-col divide-y rounded-md border">
                  {items.map((attentionItem) => (
                    <li key={`${attentionItem.reason}-${attentionItem.taskId}`}>
                      <Link
                        href={getTaskBoardHref(attentionItem.taskId)}
                        className="flex min-h-11 flex-col justify-center gap-0.5 px-3 py-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <span className="truncate font-medium">{attentionItem.title}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {attentionItem.ownerName} · {describeAttentionItem(attentionItem, generatedAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </DashboardPanel>
  );
}
