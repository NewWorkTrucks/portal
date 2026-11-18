import { KanbanDataProvider } from "@/components/kanban/kanban-data-provider";

export default function KanbanLayout({ children }: LayoutProps<"/kanban">) {
  return <KanbanDataProvider>{children}</KanbanDataProvider>;
}
