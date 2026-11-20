import type { PortalRole } from "@/types/roles";

// Row shapes returned by Supabase (snake_case, as stored). Mapped to app types in src/lib/live.

export type ProfileRow = {
  id: string;
  full_name: string;
  mention_handle: string;
  job_title: string;
  email: string | null;
  avatar_path: string | null;
};

export type BusinessRow = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
};

export type BusinessMembershipRow = {
  business_id: string;
  user_id: string;
  role: PortalRole;
};

export type KanbanTaskRow = {
  id: string;
  business_id: string;
  title: string;
  description: string;
  status: string;
  owner_id: string;
  priority: string;
  due_date: string | null;
  estimated_turnaround_amount: number | null;
  estimated_turnaround_unit: string | null;
  latest_note: string;
  position: number;
  deferral_count: number;
  last_daily_update_at: string | null;
  reviewer_id: string | null;
  waiting_on_what: string | null;
  waiting_on_who: string | null;
  contacted_date: string | null;
  follow_up_date: string | null;
  blocker: string | null;
  blocker_attempts: string | null;
  help_needed: string | null;
  revisit_date: string | null;
  completed_work: string | null;
  outcome: string | null;
  archived_at: string | null;
};

export type KanbanAttachmentRow = {
  id: string;
  task_id: string;
  file_name: string;
  size_bytes: number;
  mime_type: string;
  storage_path: string;
  uploaded_by: string | null;
  uploaded_at: string;
  /** The update it was posted with; null for files added from the Attachments section. */
  activity_id: string | null;
};

export type KanbanActivityRow = {
  id: string;
  business_id: string;
  task_id: string;
  action: string;
  actor_id: string | null;
  summary: string;
  note: string;
  mentioned_user_ids: string[];
  from_status: string | null;
  to_status: string | null;
  occurred_at: string;
};

export type MentionGroupRow = {
  id: string;
  handle: string;
  label: string;
};

export type MentionGroupMemberRow = {
  mention_group_id: string;
  user_id: string;
};

/** kanban_notifications with its activity entry, actor and card embedded. */
export type KanbanNotificationRow = {
  id: string;
  business_id: string;
  task_id: string;
  created_at: string;
  read_at: string | null;
  activity: {
    note: string;
    to_status: string | null;
    actor: { full_name: string } | null;
  } | null;
  task: { title: string } | null;
};

export type NotificationPreferencesRow = {
  notify_on_mention: boolean;
  notify_on_review_request: boolean;
  notify_on_leadership_alert: boolean;
};
