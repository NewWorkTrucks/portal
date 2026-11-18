import type { DriveStep } from "driver.js";
import {
  ONBOARDING_TOUR_DISMISSED_VALUE,
  ONBOARDING_TOUR_STEPS,
  ONBOARDING_TOUR_STORAGE_KEY,
} from "@/constants/onboarding-tour";
import type { PortalRole } from "@/types/roles";

export function isOnboardingTourDismissed(): boolean {
  try {
    return window.localStorage.getItem(ONBOARDING_TOUR_STORAGE_KEY) === ONBOARDING_TOUR_DISMISSED_VALUE;
  } catch {
    // Storage blocked: treat as not dismissed; the tour still only auto-starts once per visit.
    return false;
  }
}

export function dismissOnboardingTour(): void {
  try {
    window.localStorage.setItem(ONBOARDING_TOUR_STORAGE_KEY, ONBOARDING_TOUR_DISMISSED_VALUE);
  } catch {
    // Not saved; the tour may show again on a later visit.
  }
}

/** The tour for a role, skipping steps whose element isn't on the page. */
export function buildOnboardingTourSteps(role: PortalRole): DriveStep[] {
  return ONBOARDING_TOUR_STEPS.filter((tourStep) => !tourStep.roles || tourStep.roles.includes(role))
    .filter(
      (tourStep) =>
        !tourStep.target || document.querySelector(`[data-tour="${tourStep.target}"]`) !== null,
    )
    .map((tourStep) => ({
      element: tourStep.target ? `[data-tour="${tourStep.target}"]` : undefined,
      popover: {
        title: tourStep.title,
        description: tourStep.description,
        side: tourStep.side,
        align: "start",
      },
    }));
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
