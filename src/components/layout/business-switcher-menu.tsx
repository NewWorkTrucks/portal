"use client";

import { Building2, ChevronsUpDown } from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Switches which business's data we are viewing (E4-2). Development-only in mock mode. */
export default function BusinessSwitcherMenu() {
  const { availableBusinesses, currentBusiness, currentUser, selectBusiness } = useCurrentUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" aria-label="Switch business" />}>
        <Building2 aria-hidden />
        <span>{currentBusiness.shortName}</span>
        <ChevronsUpDown aria-hidden className="text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {currentUser.name}&rsquo;s businesses
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={currentBusiness.id}
            onValueChange={(businessId: string) => selectBusiness(businessId)}
          >
            {availableBusinesses.map((business) => (
              <DropdownMenuRadioItem key={business.id} value={business.id} closeOnClick>
                <Building2 aria-hidden />
                <span className="flex flex-col">
                  <span>{business.shortName}</span>
                  <span className="text-muted-foreground">{business.name}</span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
