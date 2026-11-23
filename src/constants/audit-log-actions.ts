import {
  Archive,
  MessageCircle,
  ArrowRightLeft,
  ClipboardCheck,
  FileMinus,
  MessageSquarePlus,
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
  update: { label: "Update", Icon: MessageSquarePlus },
  comment: { label: "Comment", Icon: MessageCircle },
  attached: { label: "Attached files", Icon: Paperclip },
  "attachment-removed": { label: "Removed file", Icon: FileMinus },
};

/** Written progress posts, shown in a card's Updates tab. */
export const UPDATE_AUDIT_LOG_ACTIONS: readonly KanbanAuditLogAction[] = ["update", "daily-update"];
