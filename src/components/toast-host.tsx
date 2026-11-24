"use client";

import { Toast } from "@base-ui/react/toast";
import { CircleCheck, TriangleAlert, X } from "lucide-react";
import { toastManager } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { ToastData } from "@/types/toast";

const MAX_VISIBLE_TOASTS = 4;

function ToastList() {
  const { toasts } = Toast.useToastManager<ToastData>();

  return (
    <Toast.Portal>
      <Toast.Viewport className="pointer-events-none fixed right-4 bottom-4 left-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:w-[26rem]">
        {toasts.map((toast) => {
          const isError = toast.type === "error";
          const StatusIcon = isError ? TriangleAlert : CircleCheck;

          return (
            <Toast.Root
              key={toast.id}
              toast={toast}
              className={cn(
                "glass-panel pointer-events-auto flex w-full gap-3 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg",
                "transition-[opacity,transform] duration-200 motion-reduce:transition-none data-ending-style:translate-y-2 data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:opacity-0 data-limited:hidden",
                isError && "border-destructive/40",
              )}
            >
              <StatusIcon aria-hidden className={cn("mt-0.5 size-4 shrink-0", isError ? "text-destructive" : "text-primary")} />
              <Toast.Content className="flex min-w-0 flex-1 flex-col gap-1">
                <Toast.Title className="text-sm font-medium break-words" />
                <Toast.Description className="text-xs/relaxed break-words text-muted-foreground" />
                {toast.data?.technicalDetails && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="w-fit cursor-pointer rounded select-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
                      Technical details
                    </summary>
                    <p className="mt-1 rounded bg-muted px-2 py-1 font-mono break-all">{toast.data.technicalDetails}</p>
                  </details>
                )}
              </Toast.Content>
              <Toast.Close
                aria-label="Dismiss"
                className="-mt-1 -mr-1 flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:size-11"
              >
                <X aria-hidden className="size-4" />
              </Toast.Close>
            </Toast.Root>
          );
        })}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

/** Shows the portal's toasts. Mounted once in the root layout; use `@/lib/toast` to show one. */
export default function ToastHost() {
  return (
    <Toast.Provider toastManager={toastManager} limit={MAX_VISIBLE_TOASTS}>
      <ToastList />
    </Toast.Provider>
  );
}
