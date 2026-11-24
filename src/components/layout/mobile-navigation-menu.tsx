"use client";

import { LayoutDashboard, Menu } from "lucide-react";
import { useState } from "react";
import PortalNavigationLinks from "@/components/layout/portal-navigation-links";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/** Phone-only menu button that opens the portal navigation in a left drawer. */
export default function MobileNavigationMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleSelectNavigationLink() {
    setIsMenuOpen(false);
  }

  return (
    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="-ml-1.5 size-11 md:hidden" aria-label="Open navigation" />}
      >
        <Menu aria-hidden className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="gap-2">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-semibold">
            <LayoutDashboard aria-hidden className="size-4 text-primary" />
            FFL Operations Portal
          </SheetTitle>
        </SheetHeader>
        <div className="px-2">
          <PortalNavigationLinks onSelectLink={handleSelectNavigationLink} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
