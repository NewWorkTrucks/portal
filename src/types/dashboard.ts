import type { ReactNode } from "react";
import type { RequestErrorDescription } from "@/types/request-error";
import type { KanbanStatus, KanbanTaskPriority } from "@/types/kanban";

export type DashboardAttentionReason =
  | "stuck"
  | "missed-update"
  | "overdue"
  | "review-over-limit"
  | "not-started-over-limit";

export type DashboardAttentionItem = {
  taskId: string;
  title: string;
  status: KanbanStatus;
  ownerName: string;
  reason: DashboardAttentionReason;
  /** When the card entered this state. */
  since: string;
  /** The missed workday or due date (YYYY-MM-DD), or the reviewer's name for an old review. */
  detail: string | null;
};

export type DashboardStageCount = {
  status: KanbanStatus;
  count: number;
};

export type DashboardPriorityCount = {
  priority: KanbanTaskPriority;
  openCount: number;
};

export type DashboardOwnerWorkload = {
  ownerId: string;
  ownerName: string;
  openCount: number;
  stuckCount: number;
  overdueCount: number;
};

export type DashboardCardReference = {
  taskId: string;
  title: string;
  ownerName: string;
};

export type DashboardOldestReview = DashboardCardReference & {
  reviewerName: string | null;
  since: string;
};

export type DashboardReviewerSummary = {
  reviewerName: string;
  openCount: number;
  completedCount: number;
  completedMedianHours: number | null;
};

export type DashboardReviewSummary = {
  openCount: number;
  openAverageHours: number | null;
  openMedianHours: number | null;
  oldestOpen: DashboardOldestReview | null;
  /** Reviews finished in the last 30 days. */
  completedCount: number;
  completedAverageHours: number | null;
  completedMedianHours: number | null;
  byReviewer: DashboardReviewerSummary[];
};

export type DashboardRepeatDeferral = DashboardCardReference & {
  status: KanbanStatus;
  deferralCount: number;
};

export type DashboardDeferralReason = DashboardCardReference & {
  reason: string;
  occurredAt: string;
};

export type DashboardDeferralSummary = {
  stuckCount: number;
  deferredCount: number;
  repeatDeferred: DashboardRepeatDeferral[];
  recentReasons: DashboardDeferralReason[];
};

export type DashboardWorkdayCompliance = {
  /** YYYY-MM-DD, US Central. */
  workday: string;
  /** Cards that needed a daily update that workday. */
  expectedCount: number;
  missedCount: number;
};

export type DashboardUpdateHealth = {
  onTrack: number;
  atRisk: number;
  offTrack: number;
  noUpdate: number;
};

export type DashboardComplianceSummary = {
  latestWorkday: string;
  /** Newest first, up to 10 workdays. */
  byWorkday: DashboardWorkdayCompliance[];
  missedOnLatestWorkday: DashboardCardReference[];
  health: DashboardUpdateHealth;
};

export type LeadershipDashboard = {
  generatedAt: string;
  /** Provisional until Miggy decides them; the database is the single source. */
  reviewLimitHours: number;
  notStartedLimitHours: number;
  attention: DashboardAttentionItem[];
  stageCounts: {
    byStatus: DashboardStageCount[];
    byPriority: DashboardPriorityCount[];
    byOwner: DashboardOwnerWorkload[];
  };
  review: DashboardReviewSummary;
  deferrals: DashboardDeferralSummary;
  compliance: DashboardComplianceSummary;
};

export type LeadershipDashboardResult =
  | { status: "ready"; dashboard: LeadershipDashboard }
  /** The person isn't in Leadership or an admin of this business. */
  | { status: "not-allowed" };

export type DashboardLoadState =
  | { status: "loading" }
  | { status: "ready"; dashboard: LeadershipDashboard; isRefreshing: boolean }
  | { status: "not-allowed" }
  | { status: "error"; error: RequestErrorDescription };

export type DashboardPanelProps = {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
};

export type DashboardAttentionListProps = {
  attention: DashboardAttentionItem[];
  reviewLimitHours: number;
  notStartedLimitHours: number;
  generatedAt: string;
};

export type DashboardStageSnapshotProps = {
  stageCounts: LeadershipDashboard["stageCounts"];
};

export type DashboardReviewSummaryProps = {
  review: DashboardReviewSummary;
  generatedAt: string;
};

export type DashboardDeferralsProps = {
  deferrals: DashboardDeferralSummary;
};

export type DashboardComplianceProps = {
  compliance: DashboardComplianceSummary;
};

export type DashboardStatTileProps = {
  label: string;
  value: string;
  detail?: ReactNode;
};
