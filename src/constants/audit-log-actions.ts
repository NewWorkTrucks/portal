import {
  Archive,
  ArrowRightLeft,
  ClipboardCheck,
  FileMinus,
  Paperclip,
  type LucideIcon,
  Pencil,
  Plus,
  TextCursorInput,
  UserRoundPen,
} from "lucide-react";
import type { KanbanAuditLogAction } from "@/types/audit-log";

export const AUDIT_LOG_ACTION_DISPLAY: Record<
  KanbanAuditLogAction,
  { label: string; Icon: LucideIcon }
> = {
  created: { label: "Created", Icon: Plus },
  edited: { label: "Edited", Icon: Pencil },
  renamed: { label: "Renamed", Icon: TextCursorInput },
  moved: { label: "Moved", Icon: ArrowRightLeft },
  "owner-changed": { label: "Owner changed", Icon: UserRoundPen },
  archived: { label: "Archived", Icon: Archive },
  "daily-update": { label: "Daily update", Icon: ClipboardCheck },
  attached: { label: "Attached files", Icon: Paperclip },
  "attachment-removed": { label: "Removed file", Icon: FileMinus },
};
