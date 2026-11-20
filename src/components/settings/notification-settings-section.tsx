"use client";

import { useEffect, useState } from "react";
import { getMyNotificationPreferences, saveMyNotificationPreferences } from "@/api/notification-preferences";
import { useDataMode } from "@/components/data-mode-provider";
import SettingsRow from "@/components/settings/settings-row";
import SettingsSection from "@/components/settings/settings-section";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCE_OPTIONS,
} from "@/constants/notification-preferences";
import type { NotificationPreferences } from "@/types/notification-preferences";

/** Which in-app notifications you receive (E3-3). Saved to your account, so it applies on every device. */
export default function NotificationSettingsSection() {
  const { dataMode } = useDataMode();

  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  // Mock mode has nothing to load.
  const [isLoading, setIsLoading] = useState(dataMode === "live");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleChangePreference(preferenceName: keyof NotificationPreferences, isOn: boolean) {
    const previousPreferences = notificationPreferences;
    const nextPreferences = { ...notificationPreferences, [preferenceName]: isOn };
    setNotificationPreferences(nextPreferences);
    setErrorMessage(null);

    if (dataMode !== "live") {
      // Mock mode: kept in this browser tab only.
      return;
    }
    const saveErrorMessage = await saveMyNotificationPreferences(nextPreferences);
    if (saveErrorMessage) {
      setNotificationPreferences(previousPreferences);
      setErrorMessage(`Couldn't save: ${saveErrorMessage}`);
    }
  }

  useEffect(() => {
    if (dataMode !== "live") {
      return;
    }
    let isCancelled = false;
    getMyNotificationPreferences()
      .then((loadedPreferences) => {
        if (!isCancelled) {
          setNotificationPreferences(loadedPreferences);
        }
      })
      .catch((loadError: Error) => {
        if (!isCancelled) {
          setErrorMessage(`Couldn't load your preferences: ${loadError.message}`);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [dataMode]);

  return (
    <SettingsSection
      title="Notifications"
      description="What shows up under the bell. Saved to your account, so it applies on every device. Email notifications are coming later."
    >
      {NOTIFICATION_PREFERENCE_OPTIONS.map((preferenceOption) => {
        const controlId = `settings-notify-${preferenceOption.preferenceName}`;
        return (
          <SettingsRow
            key={preferenceOption.preferenceName}
            controlId={controlId}
            label={preferenceOption.label}
            description={preferenceOption.description}
          >
            <Switch
              id={controlId}
              aria-labelledby={`${controlId}-label`}
              aria-describedby={`${controlId}-description`}
              checked={notificationPreferences[preferenceOption.preferenceName]}
              disabled={isLoading}
              onCheckedChange={(isOn) => void handleChangePreference(preferenceOption.preferenceName, isOn)}
            />
          </SettingsRow>
        );
      })}
      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </SettingsSection>
  );
}
