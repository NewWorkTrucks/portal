"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { XIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"

function Drawer({ ...props }: DrawerPrimitive.Root.Props) {
  return <DrawerPrimitive.Root data-slot="drawer" swipeDirection="down" {...props} />
}

/** A sheet that slides up from the bottom and can be swiped down to close, like a native app. */
function DrawerContent({
  className,
  children,
  ...props
}: DrawerPrimitive.Popup.Props & { children?: React.ReactNode }) {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Backdrop
        data-slot="drawer-overlay"
        className="fixed inset-0 z-50 bg-black/40 opacity-[calc(1-var(--drawer-swipe-progress,0))] transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0"
      />
      <DrawerPrimitive.Viewport className="fixed inset-0 z-50 flex items-end justify-center">
        <DrawerPrimitive.Popup
          data-slot="drawer-content"
          className={cn(
            "relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl border-t bg-popover text-xs/relaxed text-popover-foreground shadow-lg outline-none [transform:translateY(var(--drawer-swipe-movement-y,0px))] transition-transform duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:[transform:translateY(100%)] data-ending-style:duration-[calc(var(--drawer-swipe-strength,1)*320ms)] data-starting-style:[transform:translateY(100%)] data-swiping:duration-0 data-swiping:select-none",
            className
          )}
          {...props}
        >
          <div aria-hidden className="flex shrink-0 justify-center pt-2.5 pb-1">
            <span className="h-1.5 w-10 rounded-full bg-muted-foreground/40" />
          </div>
          <DrawerPrimitive.Close
            data-slot="drawer-close"
            render={<Button variant="ghost" className="absolute top-3 right-3 z-10" size="icon-sm" />}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DrawerPrimitive.Close>
          <DrawerPrimitive.Content className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  )
}

export { Drawer, DrawerContent }
