"use client";

import { useDevicePreferences } from "@/components/device-preferences-provider";
import SettingsRow from "@/components/settings/settings-row";
import SettingsSection from "@/components/settings/settings-section";
import { useTheme } from "@/components/theme-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ACCENT_COLOR_OPTIONS, THEME_MODE_OPTIONS } from "@/constants/theme";
import { cn } from "@/lib/utils";
import type { AccentColor, ThemeMode } from "@/types/theme";

export default function AppearanceSettingsSection() {
  const { themeMode, accentColor, setThemeMode, setAccentColor } = useTheme();
  const { isLowSpecModeOn, setLowSpecMode } = useDevicePreferences();

  return (
    <SettingsSection title="Appearance" description="Saved in this browser, so each device can be set up differently.">
      <SettingsRow controlId="settings-theme" label="Theme" description="System follows your computer's light or dark setting.">
        <Select
          items={THEME_MODE_OPTIONS}
          value={themeMode}
          onValueChange={(newThemeMode) => newThemeMode && setThemeMode(newThemeMode as ThemeMode)}
        >
          <SelectTrigger id="settings-theme" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {THEME_MODE_OPTIONS.map((themeModeOption) => (
              <SelectItem key={themeModeOption.value} value={themeModeOption.value}>
                <themeModeOption.Icon aria-hidden />
                {themeModeOption.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsRow>

      <SettingsRow controlId="settings-accent-color" label="Accent color" description="Used for buttons and highlights.">
        <Select
          items={ACCENT_COLOR_OPTIONS}
          value={accentColor}
          onValueChange={(newAccentColor) => newAccentColor && setAccentColor(newAccentColor as AccentColor)}
        >
          <SelectTrigger id="settings-accent-color" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCENT_COLOR_OPTIONS.map((accentColorOption) => (
              <SelectItem key={accentColorOption.value} value={accentColorOption.value}>
                <span
                  aria-hidden
                  className={cn("size-3.5 shrink-0 rounded-full ring-1 ring-foreground/25", accentColorOption.swatchClassName)}
                />
                {accentColorOption.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsRow>

      <SettingsRow
        controlId="settings-low-spec-mode"
        label="Low spec mode"
        description="Turns off animations, card hover effects, transitions and blur. Use it on slower computers. Starts on if your system asks for reduced motion."
      >
        <Switch
          id="settings-low-spec-mode"
          aria-labelledby="settings-low-spec-mode-label"
          aria-describedby="settings-low-spec-mode-description"
          checked={isLowSpecModeOn}
          onCheckedChange={setLowSpecMode}
        />
      </SettingsRow>
    </SettingsSection>
  );
}
