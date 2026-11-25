import type { LucideIcon } from "lucide-react";

export type BoardScopeOption<ScopeValue extends string> = {
  value: ScopeValue;
  label: string;
  description: string;
  Icon: LucideIcon;
};
