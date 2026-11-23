import type { Metadata } from "next";
import KanbanBoard from "@/components/kanban/kanban-board";
import { KANBAN_BOARD_NAME, KANBAN_COLUMN_COUNT } from "@/constants/kanban-columns";

export const metadata: Metadata = {
  title: KANBAN_BOARD_NAME,
};

export default function KanbanPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-end justify-between gap-4 px-4 pt-6 pb-4 sm:px-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{KANBAN_BOARD_NAME}</h1>
          <p className="text-sm text-muted-foreground">
            {KANBAN_COLUMN_COUNT} statuses.{" "}
            <span className="pointer-coarse:hidden">
              Drag cards to change status or reorder. Right-click a card for more actions.
            </span>
            <span className="hidden pointer-coarse:inline">Hold a card to change its status or see more actions.</span>
          </p>
        </div>
      </header>

      <KanbanBoard />
    </main>
  );
}
