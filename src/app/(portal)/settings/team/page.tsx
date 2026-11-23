import AdminSettingsGate from "@/components/settings/admin-settings-gate";
import TeamSettingsSection from "@/components/settings/team-settings-section";

export default function TeamSettingsPage() {
  return (
    <AdminSettingsGate>
      <TeamSettingsSection />
    </AdminSettingsGate>
  );
}
