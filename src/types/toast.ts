export type ToastKind = "error" | "success";

/** Extra data carried on each toast, beyond its title and description. */
export type ToastData = {
  /** The raw error, shown behind "Technical details" on error toasts. */
  technicalDetails?: string;
};

export type ToastOptions = {
  description?: string;
  technicalDetails?: string;
};
