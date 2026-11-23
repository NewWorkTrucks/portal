import type { Metadata } from "next";
import SettingsSidebar from "@/components/settings/settings-sidebar";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Your account, preferences, Kanban and organization.</p>
      </header>

      <div className="grid min-w-0 gap-6 md:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="min-w-0">
          <SettingsSidebar />
        </aside>
        <div className="flex min-w-0 flex-col gap-6">{children}</div>
      </div>
    </main>
  );
}
