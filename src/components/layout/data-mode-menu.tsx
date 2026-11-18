"use client";

import { Database, FlaskConical } from "lucide-react";
import { useDataMode } from "@/components/data-mode-provider";
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
import { DATA_MODE_OPTIONS } from "@/constants/data-mode";
import type { DataMode } from "@/types/data-mode";

const DATA_MODE_ICONS = { mock: FlaskConical, live: Database } as const;

/** Development-only switch between sample data and Supabase. */
export default function DataModeMenu() {
  const { dataMode, setDataMode } = useDataMode();
  const ActiveIcon = DATA_MODE_ICONS[dataMode];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" aria-label="Data source" />}>
        <ActiveIcon aria-hidden />
        <span className="hidden sm:inline">{dataMode === "live" ? "Live" : "Mock"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Data source (development only)</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={dataMode}
            onValueChange={(newDataMode: DataMode) => setDataMode(newDataMode)}
          >
            {DATA_MODE_OPTIONS.map((dataModeOption) => {
              const OptionIcon = DATA_MODE_ICONS[dataModeOption.value];
              return (
                <DropdownMenuRadioItem key={dataModeOption.value} value={dataModeOption.value} closeOnClick>
                  <OptionIcon aria-hidden />
                  <span className="flex flex-col">
                    <span>{dataModeOption.label}</span>
                    <span className="text-muted-foreground">{dataModeOption.description}</span>
                  </span>
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
