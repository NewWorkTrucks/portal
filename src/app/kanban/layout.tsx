import { KanbanBoardProvider } from "@/components/kanban/kanban-board-provider";
import { MOCK_KANBAN_TASKS } from "@/data/mock-kanban-tasks";

export default function KanbanLayout({ children }: LayoutProps<"/kanban">) {
  return (
    <KanbanBoardProvider initialTasks={MOCK_KANBAN_TASKS}>
      {children}
    </KanbanBoardProvider>
  );
}
