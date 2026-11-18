"use client";

import type { ReactNode } from "react";
import { useDataMode } from "@/components/data-mode-provider";
import { KanbanBoardProvider } from "@/components/kanban/kanban-board-provider";
import LiveKanbanBoardProvider from "@/components/live/live-kanban-board-provider";
import { MOCK_KANBAN_TASKS } from "@/data/mock-kanban-tasks";

type KanbanDataProviderProps = {
  children: ReactNode;
};

/** Mock mode: sample cards in this browser. Live mode: the current business's cards in Supabase. */
export function KanbanDataProvider({ children }: KanbanDataProviderProps) {
  const { dataMode } = useDataMode();

  if (dataMode === "live") {
    return <LiveKanbanBoardProvider>{children}</LiveKanbanBoardProvider>;
  }

  return <KanbanBoardProvider initialTasks={MOCK_KANBAN_TASKS}>{children}</KanbanBoardProvider>;
}
