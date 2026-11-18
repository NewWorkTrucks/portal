"use client";

import {
  Bell,
  BookOpen,
  Building2,
  Columns3,
  LogOut,
  type LucideIcon,
  Settings,
  UserRound,
} from "lucide-react";
import { signOut } from "@/api/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SettingsMenuPlaceholder = {
  label: string;
  Icon: LucideIcon;
  /** What the placeholder will become, shown in its TODO alert. */
  plannedFeature: string;
};

// TODO: Replace each placeholder with its real page or dialog as the feature is built.
const SETTINGS_MENU_PLACEHOLDERS: SettingsMenuPlaceholder[] = [
  { label: "My profile", Icon: UserRound, plannedFeature: "Profile page" },
  {
    label: "Notification preferences",
    Icon: Bell,
    plannedFeature: "In-app and email notification settings (E3-3)",
  },
  {
    label: "Switch business",
    Icon: Building2,
    plannedFeature: "Switch between NWT, Verilot and RWT (E4-2)",
  },
  {
    label: "Boards & stages",
    Icon: Columns3,
    plannedFeature: "Admin board and stage configuration (E1-1)",
  },
  { label: "Account settings", Icon: Settings, plannedFeature: "Account settings page" },
  {
    label: "Onboarding guide",
    Icon: BookOpen,
    plannedFeature: "One-page pilot onboarding guide (E5-2)",
  },
];

function handleClickSettingsPlaceholder(settingsMenuPlaceholder: SettingsMenuPlaceholder) {
  window.alert(`TODO: ${settingsMenuPlaceholder.plannedFeature}`);
}

export default function SettingsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Settings" />}>
        <Settings aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Settings</DropdownMenuLabel>
          {SETTINGS_MENU_PLACEHOLDERS.map((settingsMenuPlaceholder) => (
            <DropdownMenuItem
              key={settingsMenuPlaceholder.label}
              onClick={() => handleClickSettingsPlaceholder(settingsMenuPlaceholder)}
            >
              <settingsMenuPlaceholder.Icon aria-hidden />
              {settingsMenuPlaceholder.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
          <LogOut aria-hidden />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
