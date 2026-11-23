import AdminSettingsGate from "@/components/settings/admin-settings-gate";
import MondayImportSettingsSection from "@/components/settings/monday-import-settings-section";

export default function KanbanImportSettingsPage() {
  return (
    <AdminSettingsGate>
      <MondayImportSettingsSection />
    </AdminSettingsGate>
  );
}
