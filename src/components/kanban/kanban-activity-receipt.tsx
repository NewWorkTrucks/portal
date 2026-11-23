"use client";

import { Check, CheckCheck, Clock } from "lucide-react";
import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import UserAvatar from "@/components/user-avatar";
import { formatAuditLogTimestamp } from "@/lib/kanban-audit-log";
import { cn } from "@/lib/utils";
import type { ActivityReceipt, ActivityReceiptListProps } from "@/types/activity-receipt";

/** How long an update must stay on screen to count as seen. */
const SEEN_AFTER_ON_SCREEN_MS = 1000;
const COARSE_POINTER_QUERY = "(pointer: coarse)";

type KanbanActivityReceiptProps = {
  activityId: string;
  /** Empty when the viewer isn't the author or in Leadership, or nobody was notified. */
  receipts: readonly ActivityReceipt[];
  isUnseenByViewer: boolean;
  onSeen: (activityId: string) => void;
};

function ActivityReceiptList({ receipts }: ActivityReceiptListProps) {
  return (
    <ul className="flex flex-col gap-1.5">
      {receipts.map((receipt) => (
        <li key={receipt.recipientId} className="flex items-center gap-2 text-xs">
          <UserAvatar name={receipt.recipientName} className="size-5" />
          <span className="min-w-0 flex-1 truncate font-medium">{receipt.recipientName}</span>
          {receipt.seenAt ? (
            <time dateTime={receipt.seenAt} className="text-muted-foreground tabular-nums">
              {formatAuditLogTimestamp(receipt.seenAt)}
            </time>
          ) : (
            <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
              <Clock aria-hidden className="size-3" />
              Not seen yet
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Records when the viewer has seen an update, and shows its author and Leadership who has. */
export default function KanbanActivityReceipt({
  activityId,
  receipts,
  isUnseenByViewer,
  onSeen,
}: KanbanActivityReceiptProps) {
  const [isNamesDialogOpen, setIsNamesDialogOpen] = useState(false);
  const seenMarkerRef = useRef<HTMLSpanElement>(null);

  const seenCount = useMemo(
    () => receipts.filter((receipt) => receipt.seenAt !== null).length,
    [receipts],
  );
  const isSeenByEveryone = receipts.length > 0 && seenCount === receipts.length;

  // Hover shows the names with a mouse; touch has no hover, so a tap opens them in a dialog.
  function handleClickReceiptSummary(event: MouseEvent<HTMLElement>) {
    const isTouchPress =
      (event.nativeEvent as PointerEvent).pointerType === "touch" ||
      window.matchMedia(COARSE_POINTER_QUERY).matches;
    if (isTouchPress) {
      setIsNamesDialogOpen(true);
    }
  }

  useEffect(() => {
    const seenMarker = seenMarkerRef.current;
    if (!isUnseenByViewer || !seenMarker) {
      return;
    }

    let isOnScreen = false;
    let seenTimer: ReturnType<typeof setTimeout> | null = null;

    function updateSeenTimer() {
      const isBeingViewed = isOnScreen && document.visibilityState === "visible";
      if (isBeingViewed && seenTimer === null) {
        seenTimer = setTimeout(() => onSeen(activityId), SEEN_AFTER_ON_SCREEN_MS);
      } else if (!isBeingViewed && seenTimer !== null) {
        clearTimeout(seenTimer);
        seenTimer = null;
      }
    }

    const intersectionObserver = new IntersectionObserver(([markerEntry]) => {
      isOnScreen = markerEntry.isIntersecting;
      updateSeenTimer();
    });
    intersectionObserver.observe(seenMarker);
    document.addEventListener("visibilitychange", updateSeenTimer);

    return () => {
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", updateSeenTimer);
      if (seenTimer !== null) {
        clearTimeout(seenTimer);
      }
    };
  }, [activityId, isUnseenByViewer, onSeen]);

  return (
    <>
      {/* Sits at the end of the update, so reaching it means the whole update was on screen. */}
      {isUnseenByViewer && <span ref={seenMarkerRef} aria-hidden className="block h-px" />}

      {receipts.length > 0 && (
        <>
          <Tooltip>
            <TooltipTrigger
              closeOnClick={false}
              render={<button type="button" />}
              aria-label={`Seen by ${seenCount} of ${receipts.length}. Show names.`}
              onClick={handleClickReceiptSummary}
              className={cn(
                "-mx-1 flex min-h-6 items-center gap-1 self-start rounded px-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:min-h-11",
                isSeenByEveryone && "text-primary",
              )}
            >
              {seenCount > 0 ? (
                <CheckCheck aria-hidden className="size-3.5" />
              ) : (
                <Check aria-hidden className="size-3.5" />
              )}
              Seen by {seenCount} of {receipts.length}
            </TooltipTrigger>
            <TooltipContent className="w-72 max-w-[calc(100vw-2rem)]">
              <ActivityReceiptList receipts={receipts} />
            </TooltipContent>
          </Tooltip>

          <Dialog open={isNamesDialogOpen} onOpenChange={setIsNamesDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Seen by {seenCount} of {receipts.length}
                </DialogTitle>
                <DialogDescription>People this update notified.</DialogDescription>
              </DialogHeader>
              <ActivityReceiptList receipts={receipts} />
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}
