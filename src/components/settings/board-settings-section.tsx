"use client";

import { Building2, Route } from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { useDevicePreferences } from "@/components/device-preferences-provider";
import { useOnboardingTour } from "@/components/onboarding-tour-provider";
import GoogleChatTestSettingsSection from "@/components/settings/google-chat-test-settings-section";
import SettingsRow from "@/components/settings/settings-row";
import SettingsSection from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BOARD_BUSINESS_SCOPE_OPTIONS, BOARD_CARD_SCOPE_OPTIONS } from "@/constants/board-scope";
import { KANBAN_ROLE_DEFINITIONS } from "@/constants/kanban-role-capabilities";
import type { BoardBusinessScope, BoardCardScope } from "@/types/device-preferences";

const FIRST_BUSINESS_VALUE = "first";

export default function BoardSettingsSection() {
  const { signedInUser, currentUser, availableBusinesses, currentBusiness } = useCurrentUser();
  const {
    isDoneColumnHidden,
    defaultBusinessId,
    boardCardScope,
    boardBusinessScope,
    setDoneColumnHidden,
    setDefaultBusinessId,
    setBoardCardScope,
    setBoardBusinessScope,
  } = useDevicePreferences();
  const { requestTour } = useOnboardingTour();

  const signedInUserBusinesses = availableBusinesses.filter((business) =>
    signedInUser.businessIds.includes(business.id),
  );
  const defaultBusinessOptions = [
    { value: FIRST_BUSINESS_VALUE, label: "First in the list" },
    ...signedInUserBusinesses.map((business) => ({ value: business.id, label: business.name })),
  ];
  const selectedDefaultBusinessValue = signedInUserBusinesses.some((business) => business.id === defaultBusinessId)
    ? (defaultBusinessId as string)
    : FIRST_BUSINESS_VALUE;

  // G13: only heads and admins can widen the board; members always see their own cards.
  const canViewAllCards = KANBAN_ROLE_DEFINITIONS[currentUser.role].capabilities.canViewAllCards;

  function handleChangeDefaultBusiness(selectedValue: string | null) {
    setDefaultBusinessId(!selectedValue || selectedValue === FIRST_BUSINESS_VALUE ? null : selectedValue);
  }

  function handleChangeCardScope(selectedValue: BoardCardScope | null) {
    if (selectedValue) {
      setBoardCardScope(selectedValue);
    }
  }

  function handleChangeBusinessScope(selectedValue: BoardBusinessScope | null) {
    if (selectedValue) {
      setBoardBusinessScope(selectedValue);
    }
  }

  return (
    <>
      <SettingsSection title="Board" description="How the Kanban board opens on this device.">
        {signedInUserBusinesses.length > 1 && (
          <SettingsRow
            controlId="settings-default-business"
            label="Default business"
            description="The business the portal opens on. You can still switch from the header."
          >
            <Select
              items={defaultBusinessOptions}
              value={selectedDefaultBusinessValue}
              onValueChange={handleChangeDefaultBusiness}
            >
              <SelectTrigger id="settings-default-business" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {defaultBusinessOptions.map((businessOption) => (
                  <SelectItem key={businessOption.value} value={businessOption.value}>
                    <Building2 aria-hidden />
                    {businessOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>
        )}

        {canViewAllCards && (
          <>
            <SettingsRow
              controlId="settings-board-card-scope"
              label="Cards"
              description="Show only the cards you own, gave out or review, or everyone's cards."
            >
              <Select items={BOARD_CARD_SCOPE_OPTIONS} value={boardCardScope} onValueChange={handleChangeCardScope}>
                <SelectTrigger id="settings-board-card-scope" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOARD_CARD_SCOPE_OPTIONS.map((cardScopeOption) => (
                    <SelectItem key={cardScopeOption.value} value={cardScopeOption.value}>
                      <cardScopeOption.Icon aria-hidden />
                      {cardScopeOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsRow>

            <SettingsRow
              controlId="settings-board-business-scope"
              label="Businesses"
              description="Show the business picked in the header, or all of yours with each card tagged by business."
            >
              <Select
                items={BOARD_BUSINESS_SCOPE_OPTIONS}
                value={boardBusinessScope}
                onValueChange={handleChangeBusinessScope}
              >
                <SelectTrigger id="settings-board-business-scope" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOARD_BUSINESS_SCOPE_OPTIONS.map((businessScopeOption) => (
                    <SelectItem key={businessScopeOption.value} value={businessScopeOption.value}>
                      <businessScopeOption.Icon aria-hidden />
                      {businessScopeOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsRow>
          </>
        )}

        <SettingsRow
          controlId="settings-hide-done-column"
          label="Hide the Done column"
          description="Keeps finished work out of the way. Filtering by Done still shows it."
        >
          <Switch
            id="settings-hide-done-column"
            aria-labelledby="settings-hide-done-column-label"
            aria-describedby="settings-hide-done-column-description"
            checked={isDoneColumnHidden}
            onCheckedChange={setDoneColumnHidden}
          />
        </SettingsRow>

        <SettingsRow controlId="settings-take-tour" label="Onboarding tour" description="A short walk through the board's main features.">
          <Button id="settings-take-tour" variant="outline" onClick={requestTour}>
            <Route aria-hidden />
            Take the tour
          </Button>
        </SettingsRow>
      </SettingsSection>
      {/* Keyed so a test result never carries over to another business. */}
      <GoogleChatTestSettingsSection key={currentBusiness.id} />
    </>
  );
}
