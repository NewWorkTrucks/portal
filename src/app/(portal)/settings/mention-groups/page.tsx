import AdminSettingsGate from "@/components/settings/admin-settings-gate";
import MentionGroupsSettingsSection from "@/components/settings/mention-groups-settings-section";

export default function MentionGroupsSettingsPage() {
  return (
    <AdminSettingsGate>
      <MentionGroupsSettingsSection />
    </AdminSettingsGate>
  );
}
