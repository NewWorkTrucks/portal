import { KanbanSquare, List } from "lucide-react";
import type { KanbanBoardView, KanbanBoardViewOption } from "@/types/kanban";

export const DEFAULT_KANBAN_BOARD_VIEW: KanbanBoardView = "board";

export const KANBAN_BOARD_VIEW_OPTIONS: KanbanBoardViewOption[] = [
  { value: "board", label: "Board", Icon: KanbanSquare },
  { value: "list", label: "List", Icon: List },
];
