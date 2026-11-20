"use client";

import { Building2, Route } from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { useDevicePreferences } from "@/components/device-preferences-provider";
import { useOnboardingTour } from "@/components/onboarding-tour-provider";
import SettingsRow from "@/components/settings/settings-row";
import SettingsSection from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const FIRST_BUSINESS_VALUE = "first";

export default function BoardSettingsSection() {
  const { signedInUser, availableBusinesses } = useCurrentUser();
  const { isDoneColumnHidden, defaultBusinessId, setDoneColumnHidden, setDefaultBusinessId } = useDevicePreferences();
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

  function handleChangeDefaultBusiness(selectedValue: string | null) {
    setDefaultBusinessId(!selectedValue || selectedValue === FIRST_BUSINESS_VALUE ? null : selectedValue);
  }

  return (
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
  );
}
