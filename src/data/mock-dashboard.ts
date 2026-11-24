import type { LeadershipDashboard } from "@/types/dashboard";

const HOUR_MS = 60 * 60 * 1000;

function hoursAgo(now: Date, hours: number): string {
  return new Date(now.getTime() - hours * HOUR_MS).toISOString();
}

function centralDate(now: Date, daysAgo: number): string {
  return new Date(now.getTime() - daysAgo * 24 * HOUR_MS).toLocaleDateString("en-CA", {
    timeZone: "America/Chicago",
  });
}

/** The last `count` Monday-to-Friday dates before today, newest first, as YYYY-MM-DD. */
function previousWorkdays(now: Date, count: number): string[] {
  const workdays: string[] = [];
  for (let daysAgo = 1; workdays.length < count; daysAgo++) {
    const isoDate = centralDate(now, daysAgo);
    const weekday = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      workdays.push(isoDate);
    }
  }
  return workdays;
}

/** Sample dashboard for mock mode, shaped like kanban_get_leadership_dashboard and tied to the sample cards. */
export function buildMockLeadershipDashboard(now: Date = new Date()): LeadershipDashboard {
  const recentWorkdays = previousWorkdays(now, 10);

  return {
    generatedAt: now.toISOString(),
    reviewLimitHours: 24,
    notStartedLimitHours: 2,
    attention: [
      { taskId: "task-1", title: "Draft Q1 vendor onboarding checklist", status: "not-started", ownerName: "Sam", reason: "not-started-over-limit", since: hoursAgo(now, 5), detail: null },
      { taskId: "task-4", title: "Map user-to-manager reporting lines", status: "working-on-it", ownerName: "Sam", reason: "missed-update", since: hoursAgo(now, 15), detail: recentWorkdays[0] },
      { taskId: "task-4", title: "Map user-to-manager reporting lines", status: "working-on-it", ownerName: "Sam", reason: "overdue", since: hoursAgo(now, 30), detail: centralDate(now, 2) },
      { taskId: "task-5", title: "Weekly accomplishment report template", status: "needs-review", ownerName: "Sam", reason: "review-over-limit", since: hoursAgo(now, 31), detail: "Avery" },
      { taskId: "task-7", title: "Migrate tasks from monday.com", status: "stuck", ownerName: "Rowan", reason: "stuck", since: hoursAgo(now, 52), detail: null },
    ],
    stageCounts: {
      byStatus: [
        { status: "not-started", count: 2 },
        { status: "working-on-it", count: 2 },
        { status: "needs-review", count: 1 },
        { status: "waiting", count: 1 },
        { status: "stuck", count: 1 },
        { status: "deferred", count: 1 },
        { status: "done", count: 1 },
      ],
      byPriority: [
        { priority: "high", openCount: 3 },
        { priority: "medium", openCount: 4 },
        { priority: "low", openCount: 1 },
      ],
      byOwner: [
        { ownerId: "member-avery", ownerName: "Avery", openCount: 3, stuckCount: 0, overdueCount: 0 },
        { ownerId: "member-quinn", ownerName: "Quinn", openCount: 1, stuckCount: 0, overdueCount: 0 },
        { ownerId: "member-rowan", ownerName: "Rowan", openCount: 1, stuckCount: 1, overdueCount: 0 },
        { ownerId: "member-sam", ownerName: "Sam", openCount: 3, stuckCount: 0, overdueCount: 1 },
      ],
    },
    review: {
      openCount: 1,
      openAverageHours: 31,
      openMedianHours: 31,
      oldestOpen: {
        taskId: "task-5",
        title: "Weekly accomplishment report template",
        ownerName: "Sam",
        reviewerName: "Avery",
        since: hoursAgo(now, 31),
      },
      completedCount: 3,
      completedAverageHours: 14.3,
      completedMedianHours: 12,
      byReviewer: [
        { reviewerName: "Avery", openCount: 1, completedCount: 1, completedMedianHours: 6 },
        { reviewerName: "Jordan", openCount: 0, completedCount: 2, completedMedianHours: 18.5 },
      ],
    },
    deferrals: {
      stuckCount: 1,
      deferredCount: 1,
      repeatDeferred: [
        { taskId: "task-8", title: "Google Calendar scheduling integration", ownerName: "Avery", status: "deferred", deferralCount: 2 },
      ],
      recentReasons: [
        { taskId: "task-8", title: "Google Calendar scheduling integration", ownerName: "Avery", reason: "Waiting on Phase 2 approval before starting calendar work.", occurredAt: hoursAgo(now, 26) },
      ],
    },
    compliance: {
      latestWorkday: recentWorkdays[0],
      byWorkday: recentWorkdays.map((workday, workdayIndex) => ({
        workday,
        expectedCount: workdayIndex % 4 === 3 ? 3 : 2,
        missedCount: workdayIndex === 0 || workdayIndex === 5 ? 1 : 0,
      })),
      missedOnLatestWorkday: [{ taskId: "task-4", title: "Map user-to-manager reporting lines", ownerName: "Sam" }],
      health: { onTrack: 1, atRisk: 1, offTrack: 0, noUpdate: 0 },
    },
  };
}
