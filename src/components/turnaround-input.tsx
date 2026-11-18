"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KANBAN_TURNAROUND_UNIT_OPTIONS } from "@/constants/kanban-task-priorities";
import type { KanbanTurnaroundUnit } from "@/types/kanban";

type TurnaroundInputProps = {
  id: string;
  /** Kept as text so the field can be empty while typing. */
  amountInput: string;
  unit: KanbanTurnaroundUnit;
  onChangeAmountInput: (amountInput: string) => void;
  onChangeUnit: (unit: KanbanTurnaroundUnit) => void;
  "aria-invalid"?: boolean;
};

/** Amount plus hours/days, for an estimated turnaround (E2-1, E2-8). */
export default function TurnaroundInput({
  id,
  amountInput,
  unit,
  onChangeAmountInput,
  onChangeUnit,
  "aria-invalid": ariaInvalid,
}: TurnaroundInputProps) {
  return (
    <div className="flex gap-2">
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0.5}
        step={0.5}
        value={amountInput}
        onChange={(event) => onChangeAmountInput(event.target.value)}
        aria-invalid={ariaInvalid}
        className="min-w-0 flex-1"
      />
      <Select
        items={KANBAN_TURNAROUND_UNIT_OPTIONS}
        value={unit}
        onValueChange={(selectedUnit) =>
          selectedUnit && onChangeUnit(selectedUnit as KanbanTurnaroundUnit)
        }
      >
        <SelectTrigger aria-label="Turnaround unit" className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {KANBAN_TURNAROUND_UNIT_OPTIONS.map((unitOption) => (
            <SelectItem key={unitOption.value} value={unitOption.value}>
              {unitOption.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
