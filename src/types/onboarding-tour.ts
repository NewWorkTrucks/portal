import type { PortalRole } from "@/types/roles";

/** One step of the E5-2 onboarding tour. */
export type OnboardingTourStep = {
  id: string;
  /** The `data-tour` value of the element to highlight; omit for a centered step. */
  target?: string;
  title: string;
  description: string;
  side?: "top" | "right" | "bottom" | "left";
  /** Only shown to these roles; omit to show to everyone. */
  roles?: PortalRole[];
};

export type OnboardingTourContextValue = {
  /** Starts the tour, going to the board first if needed (Settings → Take the tour). */
  requestTour: () => void;
  /** Whether the tour was requested and hasn't started yet. */
  hasPendingTourRequest: boolean;
  /** Called by the board once it starts a tour, so it doesn't start again. */
  markTourStarted: () => void;
  /** Whether the tour already started automatically during this visit. */
  hasAutoStartedThisVisit: boolean;
};
