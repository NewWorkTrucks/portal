import { Building2, Layers, UserRound, UsersRound } from "lucide-react";
import type { BoardScopeOption } from "@/types/board-scope";
import type { BoardBusinessScope, BoardCardScope } from "@/types/device-preferences";

/** Which cards the board shows (G13, US-3.6). Heads and admins pick; members always see their own. */
export const BOARD_CARD_SCOPE_OPTIONS: BoardScopeOption<BoardCardScope>[] = [
  { value: "mine", label: "My cards", description: "Cards you own, gave out or review", Icon: UserRound },
  { value: "all", label: "All cards", description: "Everyone's cards", Icon: UsersRound },
];

/** Whether the board shows one business or all of yours, each card tagged with its business. */
export const BOARD_BUSINESS_SCOPE_OPTIONS: BoardScopeOption<BoardBusinessScope>[] = [
  { value: "current", label: "One business", description: "The business picked in the header", Icon: Building2 },
  { value: "all", label: "All businesses", description: "Every business you belong to, tagged on each card", Icon: Layers },
];
