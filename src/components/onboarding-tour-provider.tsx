"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useState } from "react";
import type { OnboardingTourContextValue } from "@/types/onboarding-tour";

const ONBOARDING_TOUR_PAGE_PATH = "/kanban";

const OnboardingTourContext = createContext<OnboardingTourContextValue | null>(null);

type OnboardingTourProviderProps = {
  children: ReactNode;
};

/**
 * Lets any page ask for the onboarding tour (E5-2). The tour itself runs on the board,
 * which reads the request; this provider just carries it across navigation.
 */
export function OnboardingTourProvider({ children }: OnboardingTourProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [hasPendingTourRequest, setHasPendingTourRequest] = useState(false);
  const [hasAutoStartedThisVisit, setHasAutoStartedThisVisit] = useState(false);

  function requestTour() {
    setHasPendingTourRequest(true);
    if (pathname !== ONBOARDING_TOUR_PAGE_PATH) {
      router.push(ONBOARDING_TOUR_PAGE_PATH);
    }
  }

  function markTourStarted() {
    setHasPendingTourRequest(false);
    setHasAutoStartedThisVisit(true);
  }

  return (
    <OnboardingTourContext.Provider
      value={{ requestTour, hasPendingTourRequest, markTourStarted, hasAutoStartedThisVisit }}
    >
      {children}
    </OnboardingTourContext.Provider>
  );
}

export function useOnboardingTour(): OnboardingTourContextValue {
  const onboardingTourContext = useContext(OnboardingTourContext);

  if (!onboardingTourContext) {
    throw new Error("useOnboardingTour must be used inside <OnboardingTourProvider>.");
  }

  return onboardingTourContext;
}
