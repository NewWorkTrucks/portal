"use client";

import {
  BookOpen,
  Building2,
  Route,
  Columns3,
  KeyRound,
  LogOut,
  type LucideIcon,
  Palette,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "@/api/auth";
import ChangePasswordDialog from "@/components/auth/change-password-dialog";
import { useCurrentUser } from "@/components/current-user-provider";
import { useDevicePreferences } from "@/components/device-preferences-provider";
import { useDataMode } from "@/components/data-mode-provider";
import { useOnboardingTour } from "@/components/onboarding-tour-provider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BOARD_BUSINESS_SCOPE_OPTIONS, BOARD_CARD_SCOPE_OPTIONS } from "@/constants/board-scope";
import { KANBAN_ROLE_DEFINITIONS } from "@/constants/kanban-role-capabilities";
import { ACCENT_COLOR_OPTIONS, THEME_MODE_OPTIONS } from "@/constants/theme";
import { cn } from "@/lib/utils";
import type { BoardBusinessScope, BoardCardScope } from "@/types/device-preferences";
import type { AccentColor, ThemeMode } from "@/types/theme";

type SettingsMenuPlaceholder = {
  label: string;
  Icon: LucideIcon;
  /** What the placeholder will become, shown in its TODO alert. */
  plannedFeature: string;
};

// TODO: Replace each placeholder with its real page or dialog as the feature is built.
const SETTINGS_MENU_PLACEHOLDERS: SettingsMenuPlaceholder[] = [
  {
    label: "Switch business",
    Icon: Building2,
    plannedFeature: "Switch between NWT, Verilot IM and RWT (E4-2)",
  },
  {
    label: "Boards & stages",
    Icon: Columns3,
    plannedFeature: "Admin board and stage configuration (E1-1)",
  },
  {
    label: "One-page guide",
    Icon: BookOpen,
    plannedFeature: "Printable one-page pilot guide (E5-2)",
  },
];

function handleClickSettingsPlaceholder(settingsMenuPlaceholder: SettingsMenuPlaceholder) {
  window.alert(`TODO: ${settingsMenuPlaceholder.plannedFeature}`);
}

export default function SettingsMenu() {
  const { themeMode, accentColor, setThemeMode, setAccentColor } = useTheme();
  const { requestTour } = useOnboardingTour();
  const { dataMode } = useDataMode();
  const { currentUser } = useCurrentUser();
  const { boardCardScope, boardBusinessScope, setBoardCardScope, setBoardBusinessScope } = useDevicePreferences();

  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);

  const activeThemeModeOption =
    THEME_MODE_OPTIONS.find((option) => option.value === themeMode) ?? THEME_MODE_OPTIONS[0];
  const activeAccentColorOption =
    ACCENT_COLOR_OPTIONS.find((option) => option.value === accentColor) ?? ACCENT_COLOR_OPTIONS[0];
  // G13: only heads and admins can widen the board; members always see their own cards.
  const canViewAllCards = KANBAN_ROLE_DEFINITIONS[currentUser.role].capabilities.canViewAllCards;
  const activeCardScopeOption =
    BOARD_CARD_SCOPE_OPTIONS.find((option) => option.value === boardCardScope) ?? BOARD_CARD_SCOPE_OPTIONS[0];
  const activeBusinessScopeOption =
    BOARD_BUSINESS_SCOPE_OPTIONS.find((option) => option.value === boardBusinessScope) ??
    BOARD_BUSINESS_SCOPE_OPTIONS[0];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Settings" data-tour="settings" />}>
          <Settings aria-hidden />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuItem render={<Link href="/settings" />}>
              <SlidersHorizontal aria-hidden />
              All settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={requestTour}>
              <Route aria-hidden />
              Take the tour
            </DropdownMenuItem>
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

          {canViewAllCards && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Board view</DropdownMenuLabel>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <activeCardScopeOption.Icon aria-hidden />
                    Cards
                    <span className="ml-auto text-muted-foreground">{activeCardScopeOption.label}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-44">
                    <DropdownMenuRadioGroup
                      value={boardCardScope}
                      onValueChange={(newCardScope: BoardCardScope) => setBoardCardScope(newCardScope)}
                    >
                      {BOARD_CARD_SCOPE_OPTIONS.map((cardScopeOption) => (
                        <DropdownMenuRadioItem key={cardScopeOption.value} value={cardScopeOption.value}>
                          <cardScopeOption.Icon aria-hidden />
                          {cardScopeOption.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <activeBusinessScopeOption.Icon aria-hidden />
                    Businesses
                    <span className="ml-auto text-muted-foreground">{activeBusinessScopeOption.label}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-44">
                    <DropdownMenuRadioGroup
                      value={boardBusinessScope}
                      onValueChange={(newBusinessScope: BoardBusinessScope) => setBoardBusinessScope(newBusinessScope)}
                    >
                      {BOARD_BUSINESS_SCOPE_OPTIONS.map((businessScopeOption) => (
                        <DropdownMenuRadioItem key={businessScopeOption.value} value={businessScopeOption.value}>
                          <businessScopeOption.Icon aria-hidden />
                          {businessScopeOption.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuGroup>
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <activeThemeModeOption.Icon aria-hidden />
                Theme
                <span className="ml-auto text-muted-foreground">{activeThemeModeOption.label}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-40">
                <DropdownMenuRadioGroup
                  value={themeMode}
                  onValueChange={(newThemeMode: ThemeMode) => setThemeMode(newThemeMode)}
                >
                  {THEME_MODE_OPTIONS.map((themeModeOption) => (
                    <DropdownMenuRadioItem key={themeModeOption.value} value={themeModeOption.value}>
                      <themeModeOption.Icon aria-hidden />
                      {themeModeOption.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Palette aria-hidden />
                Accent color
                <span
                  aria-hidden
                  className={cn("ml-auto size-3 rounded-full ring-1 ring-foreground/25", activeAccentColorOption.swatchClassName)}
                />
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-40">
                <DropdownMenuRadioGroup
                  value={accentColor}
                  onValueChange={(newAccentColor: AccentColor) => setAccentColor(newAccentColor)}
                >
                  {ACCENT_COLOR_OPTIONS.map((accentColorOption) => (
                    <DropdownMenuRadioItem key={accentColorOption.value} value={accentColorOption.value}>
                      <span
                        aria-hidden
                        className={cn("size-3.5 shrink-0 rounded-full ring-1 ring-foreground/25", accentColorOption.swatchClassName)}
                      />
                      {accentColorOption.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {dataMode === "live" && (
            <DropdownMenuItem onClick={() => setIsChangePasswordDialogOpen(true)}>
              <KeyRound aria-hidden />
              Change password
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" onClick={() => void signOut(dataMode)}>
            <LogOut aria-hidden />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangePasswordDialog isOpen={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen} />
    </>
  );
}
