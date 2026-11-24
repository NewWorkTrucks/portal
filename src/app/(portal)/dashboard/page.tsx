import type { Metadata } from "next";
import LeadershipDashboard from "@/components/dashboard/leadership-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          What needs attention across the board, refreshed each time you open it. Times are US Central.
        </p>
      </header>

      <LeadershipDashboard />
    </main>
  );
}
