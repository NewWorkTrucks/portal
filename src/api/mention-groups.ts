import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { MentionGroupMemberRow, MentionGroupRow } from "@/types/live/rows";
import type { EditableMentionGroup, MentionGroupFormValues } from "@/types/mention";

// Live mode. RLS lets every member read a business's groups and only its admins change them;
// database triggers protect the Leadership group and keep members inside the business.

const LIVE_MODE_NOT_SET_UP_MESSAGE = "Live mode isn't set up.";
const DUPLICATE_KEY_ERROR_CODE = "23505";

function requireSupabase() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error(LIVE_MODE_NOT_SET_UP_MESSAGE);
  }
  return supabase;
}

export async function listMentionGroups(businessId: string): Promise<EditableMentionGroup[]> {
  const supabase = requireSupabase();
  const groupsResult = await supabase
    .from("mention_groups")
    .select("id, handle, label")
    .eq("business_id", businessId)
    .order("label");
  if (groupsResult.error) {
    throw groupsResult.error;
  }
  const groupRows = groupsResult.data as MentionGroupRow[];
  if (groupRows.length === 0) {
    return [];
  }

  const membersResult = await supabase
    .from("mention_group_members")
    .select("mention_group_id, user_id")
    .in(
      "mention_group_id",
      groupRows.map((groupRow) => groupRow.id),
    );
  if (membersResult.error) {
    throw membersResult.error;
  }
  const memberRows = membersResult.data as MentionGroupMemberRow[];

  return groupRows.map((groupRow) => ({
    id: groupRow.id,
    handle: groupRow.handle,
    label: groupRow.label,
    memberIds: memberRows
      .filter((memberRow) => memberRow.mention_group_id === groupRow.id)
      .map((memberRow) => memberRow.user_id),
  }));
}

export async function createMentionGroup(
  businessId: string,
  mentionGroupFormValues: MentionGroupFormValues,
): Promise<EditableMentionGroup> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("mention_groups")
    .insert({ business_id: businessId, handle: mentionGroupFormValues.handle, label: mentionGroupFormValues.label })
    .select("id, handle, label")
    .single();
  if (error) {
    throw new Error(
      error.code === DUPLICATE_KEY_ERROR_CODE
        ? `@${mentionGroupFormValues.handle} is already a group in this business.`
        : error.message,
    );
  }
  const groupRow = data as MentionGroupRow;
  return { id: groupRow.id, handle: groupRow.handle, label: groupRow.label, memberIds: [] };
}

export async function deleteMentionGroup(groupId: string): Promise<void> {
  const { error } = await requireSupabase().from("mention_groups").delete().eq("id", groupId);
  if (error) {
    throw error;
  }
}

export async function addMentionGroupMember(groupId: string, userId: string): Promise<void> {
  const { error } = await requireSupabase()
    .from("mention_group_members")
    .insert({ mention_group_id: groupId, user_id: userId });
  if (error) {
    throw error;
  }
}

export async function removeMentionGroupMember(groupId: string, userId: string): Promise<void> {
  const { error } = await requireSupabase()
    .from("mention_group_members")
    .delete()
    .eq("mention_group_id", groupId)
    .eq("user_id", userId);
  if (error) {
    throw error;
  }
}
