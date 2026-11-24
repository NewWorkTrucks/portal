import Link from "next/link";
import DashboardPanel, { DashboardStatTile } from "@/components/dashboard/dashboard-panel";
import { formatDurationHours, formatElapsedSince, getTaskBoardHref } from "@/lib/dashboard";
import type { DashboardReviewSummaryProps } from "@/types/dashboard";

/** How long cards wait in Needs Review, now and over the last 30 days, and by reviewer. */
export default function DashboardReviewSummary({ review, generatedAt }: DashboardReviewSummaryProps) {
  const { oldestOpen } = review;

  return (
    <DashboardPanel title="Time in Needs Review" description="Open reviews now, and reviews finished in the last 30 days.">
      <dl className="grid grid-cols-2 gap-2">
        <DashboardStatTile
          label="Open now"
          value={String(review.openCount)}
          detail={review.openCount > 0 ? `Median ${formatDurationHours(review.openMedianHours)}` : undefined}
        />
        <DashboardStatTile
          label="Oldest open"
          value={oldestOpen ? formatElapsedSince(oldestOpen.since, generatedAt) : "None"}
          detail={
            oldestOpen && (
              <Link href={getTaskBoardHref(oldestOpen.taskId)} className="underline-offset-2 hover:underline">
                {oldestOpen.title}
              </Link>
            )
          }
        />
        <DashboardStatTile
          label="Finished, last 30 days"
          value={String(review.completedCount)}
          detail={review.completedCount > 0 ? `Average ${formatDurationHours(review.completedAverageHours)}` : undefined}
        />
        <DashboardStatTile label="Median time to finish" value={formatDurationHours(review.completedMedianHours)} />
      </dl>

      {review.byReviewer.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-1.5 font-medium">Reviewer</th>
                <th scope="col" className="px-3 py-1.5 text-right font-medium">Open</th>
                <th scope="col" className="px-3 py-1.5 text-right font-medium">Finished</th>
                <th scope="col" className="px-3 py-1.5 text-right font-medium">Median</th>
              </tr>
            </thead>
            <tbody>
              {review.byReviewer.map((reviewerSummary) => (
                <tr key={reviewerSummary.reviewerName} className="border-t">
                  <th scope="row" className="px-3 py-1.5 font-normal">{reviewerSummary.reviewerName}</th>
                  <td className="px-3 py-1.5 text-right tabular-nums">{reviewerSummary.openCount}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{reviewerSummary.completedCount}</td>
                  <td className="px-3 py-1.5 text-right whitespace-nowrap tabular-nums">
                    {reviewerSummary.completedCount > 0 ? formatDurationHours(reviewerSummary.completedMedianHours) : "None yet"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardPanel>
  );
}
