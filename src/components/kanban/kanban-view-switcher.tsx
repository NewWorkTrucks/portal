"use client";

import { Button } from "@/components/ui/button";
import { KANBAN_BOARD_VIEW_OPTIONS } from "@/constants/kanban-board-views";
import type { KanbanViewSwitcherProps } from "@/types/kanban";

export default function KanbanViewSwitcher({ selectedView, onSelectView }: KanbanViewSwitcherProps) {
  return (
    <div role="group" aria-label="Task view" className="flex shrink-0 gap-1 rounded-lg border bg-muted/50 p-1">
      {KANBAN_BOARD_VIEW_OPTIONS.map((viewOption) => (
        <Button
          key={viewOption.value}
          size="sm"
          variant={selectedView === viewOption.value ? "secondary" : "ghost"}
          aria-pressed={selectedView === viewOption.value}
          onClick={() => onSelectView(viewOption.value)}
        >
          <viewOption.Icon aria-hidden />
          {viewOption.label}
        </Button>
      ))}
    </div>
  );
}
