"use client";

import KanbanRecurrenceForm from "@/components/forms/kanban-recurrence-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getTodayIsoDate } from "@/lib/kanban";
import type { KanbanRecurrenceDialogProps } from "@/types/kanban-recurrence";

/** Wraps the repeat form for one card (US-1.3). */
export default function KanbanRecurrenceDialog({
  taskTitle,
  initialRecurrence,
  isOpen,
  onOpenChange,
  onSubmit,
}: KanbanRecurrenceDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Repeat</DialogTitle>
          <DialogDescription>How often &ldquo;{taskTitle}&rdquo; comes back. Changes only affect future rounds.</DialogDescription>
        </DialogHeader>
        {isOpen && (
          <KanbanRecurrenceForm
            initialRecurrence={initialRecurrence}
            today={getTodayIsoDate()}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
