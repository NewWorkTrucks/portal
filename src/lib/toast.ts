import { Toast } from "@base-ui/react/toast";
import { describeRequestError } from "@/lib/request-error";
import type { ToastData, ToastOptions } from "@/types/toast";

/** The one toast manager, shared by the host in the root layout and any code that shows a toast. */
export const toastManager = Toast.createToastManager<ToastData>();

const ERROR_TOAST_TIMEOUT_MS = 10_000;
const SUCCESS_TOAST_TIMEOUT_MS = 4_000;
// A failing realtime reload could repeat the same error every few seconds; show it once.
const DUPLICATE_ERROR_WINDOW_MS = 10_000;

const lastShownAtByErrorKey = new Map<string, number>();

/** Shows an error toast. Call from event handlers and async code, never while rendering. */
export function showErrorToast(title: string, { description, technicalDetails }: ToastOptions = {}) {
  const errorKey = `${title}|${description ?? ""}`;
  const now = Date.now();
  const lastShownAt = lastShownAtByErrorKey.get(errorKey);
  if (lastShownAt !== undefined && now - lastShownAt < DUPLICATE_ERROR_WINDOW_MS) {
    return;
  }
  lastShownAtByErrorKey.set(errorKey, now);

  toastManager.add({
    type: "error",
    title,
    description,
    priority: "high",
    timeout: ERROR_TOAST_TIMEOUT_MS,
    data: { technicalDetails },
  });
}

export function showSuccessToast(title: string, { description }: ToastOptions = {}) {
  toastManager.add({
    type: "success",
    title,
    description,
    timeout: SUCCESS_TOAST_TIMEOUT_MS,
  });
}

/**
 * Shows a failed request as a plain-language error toast: the cause, what to do next, and the
 * raw error behind "Technical details". `consequence` adds what that means for the person,
 * e.g. "Your comment is still in the box."
 */
export function showRequestErrorToast(requestError: unknown, failedAction: string, consequence?: string) {
  const { title, description, technicalDetails } = describeRequestError(requestError, failedAction);
  showErrorToast(title, {
    description: consequence ? `${description} ${consequence}` : description,
    technicalDetails,
  });
}
