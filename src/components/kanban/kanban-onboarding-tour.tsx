"use client";

import { type Driver, driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, useRef } from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import { useOnboardingTour } from "@/components/onboarding-tour-provider";
import {
  buildOnboardingTourSteps,
  dismissOnboardingTour,
  isOnboardingTourDismissed,
  prefersReducedMotion,
} from "@/lib/onboarding-tour";

// Lets the board lay out before the tour measures the elements it highlights.
const TOUR_START_DELAY_MS = 400;

/**
 * E5-2: walks new users through the board with driver.js. It starts on a visit unless the
 * user chose "Don't show again" or finished it, and Settings → Take the tour replays it.
 */
export default function KanbanOnboardingTour() {
  const { currentUser } = useCurrentUser();
  const { hasPendingTourRequest, hasAutoStartedThisVisit, markTourStarted } = useOnboardingTour();

  const tourDriverRef = useRef<Driver | null>(null);

  function startTour() {
    tourDriverRef.current?.destroy();

    const tourDriver = driver({
      steps: buildOnboardingTourSteps(currentUser.role),
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
      popoverClass: "ffl-tour-popover",
      animate: !prefersReducedMotion(),
      smoothScroll: !prefersReducedMotion(),
      stagePadding: 6,
      stageRadius: 10,
      skipMissingElement: true,
      onPopoverRender: (popover) => {
        const dismissButton = document.createElement("button");
        dismissButton.type = "button";
        dismissButton.className = "ffl-tour-dismiss-button";
        dismissButton.textContent = "Don't show again";
        dismissButton.addEventListener("click", () => {
          dismissOnboardingTour();
          tourDriver.destroy();
        });
        popover.footer.prepend(dismissButton);
      },
      onDestroyed: (_element, _step, { reason }) => {
        // Finishing counts as "seen"; closing early shows it again on the next visit.
        if (reason === "done") {
          dismissOnboardingTour();
        }
        tourDriverRef.current = null;
      },
    });

    tourDriverRef.current = tourDriver;
    markTourStarted();
    tourDriver.drive();
  }

  useEffect(() => {
    const shouldStartTour =
      hasPendingTourRequest || (!hasAutoStartedThisVisit && !isOnboardingTourDismissed());

    if (!shouldStartTour || tourDriverRef.current?.isActive()) {
      return;
    }

    const startTimeout = window.setTimeout(startTour, TOUR_START_DELAY_MS);
    return () => window.clearTimeout(startTimeout);
    // startTour reads the latest role when it runs; re-run only when a start is requested.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPendingTourRequest, hasAutoStartedThisVisit]);

  useEffect(() => {
    return () => tourDriverRef.current?.destroy();
  }, []);

  return null;
}
