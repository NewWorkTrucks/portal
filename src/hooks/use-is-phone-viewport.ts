"use client";

import { useSyncExternalStore } from "react";

// Below Tailwind's md breakpoint. Tablets keep the side panel.
const PHONE_VIEWPORT_QUERY = "(max-width: 767px)";

function subscribeToPhoneViewport(onChange: () => void) {
  const mediaQueryList = window.matchMedia(PHONE_VIEWPORT_QUERY);
  mediaQueryList.addEventListener("change", onChange);
  return () => mediaQueryList.removeEventListener("change", onChange);
}

function getIsPhoneViewport() {
  return window.matchMedia(PHONE_VIEWPORT_QUERY).matches;
}

function getIsPhoneViewportOnServer() {
  return false;
}

export function useIsPhoneViewport(): boolean {
  return useSyncExternalStore(subscribeToPhoneViewport, getIsPhoneViewport, getIsPhoneViewportOnServer);
}
