import type { Metadata } from "next";
import KanbanBoard from "@/components/kanban/kanban-board";
import { KANBAN_BOARD_NAME } from "@/constants/kanban-columns";

export const metadata: Metadata = {
  title: KANBAN_BOARD_NAME,
};

export default function KanbanPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <KanbanBoard />
    </main>
  );
}
