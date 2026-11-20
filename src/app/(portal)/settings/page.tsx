import type { Metadata } from "next";
import AppearanceSettingsSection from "@/components/settings/appearance-settings-section";
import BoardSettingsSection from "@/components/settings/board-settings-section";
import ProfileSettingsSection from "@/components/settings/profile-settings-section";
import TeamSettingsSection from "@/components/settings/team-settings-section";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Your profile, how the portal looks, and how the board opens.</p>
      </header>

      <ProfileSettingsSection />
      <AppearanceSettingsSection />
      <BoardSettingsSection />
      <TeamSettingsSection />
    </main>
  );
}
