import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import KanbanAuditLog from "@/components/kanban/kanban-audit-log";
import { buttonVariants } from "@/components/ui/button";
import { KANBAN_BOARD_NAME } from "@/constants/kanban-columns";

export const metadata: Metadata = {
  title: "Audit log",
};

// TODO: Temporary route under /kanban so it shares the board's in-memory state. Move the audit log
// to its own page in the portal navigation (plus a per-card activity view) once the backend
// activity-log endpoint exists and entries no longer live in client state.
export default function KanbanAuditLogPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-6">
      <header className="flex flex-col gap-3">
        <Link href="/kanban" className={buttonVariants({ variant: "ghost", className: "w-fit" })}>
          <ArrowLeft aria-hidden />
          Back to {KANBAN_BOARD_NAME}
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Audit log</h1>
          <p className="text-sm text-muted-foreground">
            Every create, edit, rename, move, reassignment and archive, newest first. Entries can&rsquo;t
            be edited or deleted.
          </p>
        </div>
      </header>

      <KanbanAuditLog />
    </main>
  );
}
