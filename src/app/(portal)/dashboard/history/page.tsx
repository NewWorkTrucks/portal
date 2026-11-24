import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import DailyTaskHistory from "@/components/daily-tasks/daily-task-history";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Daily Tasks history",
};

export default function DailyTaskHistoryPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-3">
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost", className: "w-fit" })}>
          <ArrowLeft aria-hidden />
          Back to Dashboard
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Daily Tasks history</h1>
          <p className="text-sm text-muted-foreground">
            Each workday&rsquo;s to-dos and how they went. Pick a day to see its list or mark it as a day off.
          </p>
        </div>
      </header>

      <DailyTaskHistory />
    </main>
  );
}
