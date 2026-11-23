"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTaskReceipts, markActivitySeen } from "@/api/activity-receipts";
import { useCurrentUser } from "@/components/current-user-provider";
import { useDataMode } from "@/components/data-mode-provider";
import type { ActivityReceipt, TaskReceiptsState } from "@/types/activity-receipt";
import type { KanbanAuditLogEntry } from "@/types/audit-log";

/** Other people's receipts have no Realtime feed (notifications are private), so refresh on a timer. */
const RECEIPTS_REFRESH_INTERVAL_MS = 30_000;
/** Updates seen around the same moment are saved together. */
const MARK_SEEN_BATCH_DELAY_MS = 300;

const EMPTY_RECEIPTS_STATE: TaskReceiptsState = { receipts: [], unseenActivityIds: [] };

/** Sample data: the first person notified has seen each update. */
function buildMockReceipts(auditLogEntries: readonly KanbanAuditLogEntry[]): ActivityReceipt[] {
  return auditLogEntries.flatMap((auditLogEntry) =>
    auditLogEntry.mentionedNames
      .filter((mentionedName) => mentionedName !== auditLogEntry.actorName)
      .map((mentionedName, mentionedIndex) => ({
        activityId: auditLogEntry.id,
        recipientId: mentionedName,
        recipientName: mentionedName,
        seenAt: mentionedIndex === 0 ? auditLogEntry.occurredAt : null,
      })),
  );
}

/** A card's read receipts while its details are open, and a way to record what the viewer saw. */
export function useTaskReceipts(
  taskId: string | null,
  isOpen: boolean,
  auditLogEntries: readonly KanbanAuditLogEntry[],
) {
  const { dataMode } = useDataMode();
  const { isSimulatingUser } = useCurrentUser();

  const [loadedReceipts, setLoadedReceipts] = useState<{
    taskId: string;
    state: TaskReceiptsState;
  } | null>(null);
  const pendingSeenActivityIdsRef = useRef(new Set<string>());
  const markSeenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestLoadIdRef = useRef(0);

  const isLive = dataMode === "live";
  const receiptsState =
    loadedReceipts && loadedReceipts.taskId === taskId
      ? loadedReceipts.state
      : EMPTY_RECEIPTS_STATE;

  const receiptsByActivityId = useMemo(() => {
    const receipts = isLive ? receiptsState.receipts : buildMockReceipts(auditLogEntries);
    const groupedReceipts = new Map<string, ActivityReceipt[]>();
    for (const receipt of receipts) {
      groupedReceipts.set(receipt.activityId, [
        ...(groupedReceipts.get(receipt.activityId) ?? []),
        receipt,
      ]);
    }
    return groupedReceipts;
  }, [auditLogEntries, isLive, receiptsState.receipts]);

  // Viewing as someone must never record a receipt for the real or the simulated person.
  const unseenActivityIds = useMemo(
    () => new Set(isLive && !isSimulatingUser ? receiptsState.unseenActivityIds : []),
    [isLive, isSimulatingUser, receiptsState.unseenActivityIds],
  );

  const loadReceipts = useCallback(async () => {
    if (!taskId) {
      return;
    }
    latestLoadIdRef.current += 1;
    const loadId = latestLoadIdRef.current;
    try {
      const state = await getTaskReceipts(taskId);
      if (loadId === latestLoadIdRef.current) {
        setLoadedReceipts({ taskId, state });
      }
    } catch (error) {
      // A background refresh: keep what's shown and try again on the next one.
      console.error("Couldn't load read receipts", error);
    }
  }, [taskId]);

  const flushSeenActivity = useCallback(async () => {
    markSeenTimerRef.current = null;
    const activityIds = [...pendingSeenActivityIdsRef.current];
    pendingSeenActivityIdsRef.current.clear();
    if (activityIds.length === 0) {
      return;
    }
    try {
      await markActivitySeen(activityIds);
    } catch (error) {
      console.error("Couldn't record seen updates", error);
    }
    await loadReceipts();
  }, [loadReceipts]);

  const markSeen = useCallback(
    (activityId: string) => {
      pendingSeenActivityIdsRef.current.add(activityId);
      markSeenTimerRef.current ??= setTimeout(
        () => void flushSeenActivity(),
        MARK_SEEN_BATCH_DELAY_MS,
      );
    },
    [flushSeenActivity],
  );

  useEffect(() => {
    if (!isLive || !isOpen || !taskId) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading external data when opened
    void loadReceipts();

    function handleWindowFocus() {
      void loadReceipts();
    }
    const refreshTimer = setInterval(handleWindowFocus, RECEIPTS_REFRESH_INTERVAL_MS);
    window.addEventListener("focus", handleWindowFocus);
    return () => {
      clearInterval(refreshTimer);
      window.removeEventListener("focus", handleWindowFocus);
    };
    // New activity on the card can add receipts, so it reloads too.
  }, [isLive, isOpen, taskId, loadReceipts, auditLogEntries.length]);

  // Closing the card right after seeing an update must still save it.
  useEffect(
    () => () => {
      if (markSeenTimerRef.current !== null) {
        clearTimeout(markSeenTimerRef.current);
        void flushSeenActivity();
      }
    },
    [flushSeenActivity],
  );

  return { receiptsByActivityId, unseenActivityIds, markSeen };
}
