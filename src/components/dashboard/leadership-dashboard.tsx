"use client";

import { Lock, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLeadershipDashboard } from "@/api/dashboard";
import { useCurrentUser } from "@/components/current-user-provider";
import DashboardAttentionList from "@/components/dashboard/dashboard-attention-list";
import DashboardCompliance from "@/components/dashboard/dashboard-compliance";
import DashboardDeferrals from "@/components/dashboard/dashboard-deferrals";
import DashboardLoadErrorPanel from "@/components/dashboard/dashboard-load-error";
import DashboardReviewSummary from "@/components/dashboard/dashboard-review-summary";
import DashboardStageSnapshot from "@/components/dashboard/dashboard-stage-snapshot";
import { useDataMode } from "@/components/data-mode-provider";
import { Button } from "@/components/ui/button";
import { buildMockLeadershipDashboard } from "@/data/mock-dashboard";
import { MOCK_MENTION_GROUPS } from "@/data/mock-mention-groups";
import { formatDashboardUpdatedAt } from "@/lib/dashboard";
import { describeRequestError } from "@/lib/request-error";
import type { DashboardLoadState, LeadershipDashboardResult } from "@/types/dashboard";

/**
 * The Leadership dashboard widgets for the current business (E5-4). The database decides who may
 * read them (Leadership and admins) and computes every number when asked, so a reload is current.
 */
export default function LeadershipDashboard() {
  const { currentUser, currentBusiness } = useCurrentUser();
  const { dataMode } = useDataMode();
  const latestRequestIdRef = useRef(0);

  const [loadState, setLoadState] = useState<DashboardLoadState>({ status: "loading" });

  // Mock mode copies the database rule, since there is no database to ask.
  const isAllowedInMockMode = useMemo(
    () =>
      currentUser.role === "admin" ||
      MOCK_MENTION_GROUPS.some(
        (mentionGroup) => mentionGroup.handle === "Leadership" && mentionGroup.memberNames.includes(currentUser.name),
      ),
    [currentUser],
  );

  function handleClickRefresh() {
    void loadDashboard();
  }

  const loadDashboard = useCallback(async () => {
    latestRequestIdRef.current += 1;
    const requestId = latestRequestIdRef.current;
    setLoadState((previousLoadState) =>
      previousLoadState.status === "ready" ? { ...previousLoadState, isRefreshing: true } : { status: "loading" },
    );

    try {
      const result: LeadershipDashboardResult =
        dataMode === "mock"
          ? isAllowedInMockMode
            ? { status: "ready", dashboard: buildMockLeadershipDashboard() }
            : { status: "not-allowed" }
          : await getLeadershipDashboard(currentBusiness.id);
      if (requestId !== latestRequestIdRef.current) {
        return;
      }
      setLoadState(
        result.status === "ready"
          ? { status: "ready", dashboard: result.dashboard, isRefreshing: false }
          : { status: "not-allowed" },
      );
    } catch (loadError) {
      if (requestId === latestRequestIdRef.current) {
        setLoadState({ status: "error", error: describeRequestError(loadError, "load the dashboard") });
      }
    }
  }, [currentBusiness.id, dataMode, isAllowedInMockMode]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loadState.status === "loading") {
    return <p className="text-sm text-muted-foreground">Loading the dashboard…</p>;
  }

  if (loadState.status === "not-allowed") {
    return (
      <section className="flex max-w-xl flex-col gap-2 rounded-lg border bg-card p-5 text-sm">
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
          <Lock aria-hidden className="size-4 text-muted-foreground" />
          For Leadership and admins
        </h2>
        <p className="text-muted-foreground">
          The dashboard widgets are for Leadership and admins in {currentBusiness.shortName}. Ask an admin to add you to
          the Leadership group if you need them.
        </p>
      </section>
    );
  }

  if (loadState.status === "error") {
    return <DashboardLoadErrorPanel error={loadState.error} onRetry={handleClickRefresh} />;
  }

  const { dashboard, isRefreshing } = loadState;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {currentBusiness.shortName} · Updated {formatDashboardUpdatedAt(dashboard.generatedAt)}
        </p>
        <Button variant="outline" size="sm" onClick={handleClickRefresh} disabled={isRefreshing}>
          <RefreshCw aria-hidden className={isRefreshing ? "animate-spin motion-reduce:animate-none" : undefined} />
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <DashboardAttentionList
          attention={dashboard.attention}
          reviewLimitHours={dashboard.reviewLimitHours}
          notStartedLimitHours={dashboard.notStartedLimitHours}
          generatedAt={dashboard.generatedAt}
        />
        <DashboardStageSnapshot stageCounts={dashboard.stageCounts} />
        <DashboardReviewSummary review={dashboard.review} generatedAt={dashboard.generatedAt} />
        <DashboardDeferrals deferrals={dashboard.deferrals} />
        <DashboardCompliance compliance={dashboard.compliance} />
      </div>
    </div>
  );
}
