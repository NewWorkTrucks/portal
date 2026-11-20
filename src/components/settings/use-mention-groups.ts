"use client";

import { useEffect, useState } from "react";
import {
  addMentionGroupMember,
  createMentionGroup,
  deleteMentionGroup,
  listMentionGroups,
  removeMentionGroupMember,
} from "@/api/mention-groups";
import { useCurrentUser } from "@/components/current-user-provider";
import { useDataMode } from "@/components/data-mode-provider";
import { MOCK_MENTION_GROUPS } from "@/data/mock-mention-groups";
import type { EditableMentionGroup, MentionGroupFormValues } from "@/types/mention";
import type { TeamMember } from "@/types/team";

function getMockMentionGroups(teamMembers: TeamMember[]): EditableMentionGroup[] {
  return MOCK_MENTION_GROUPS.map((mentionGroup) => ({
    id: `mock-group-${mentionGroup.handle}`,
    handle: mentionGroup.handle,
    label: mentionGroup.label,
    memberIds: teamMembers
      .filter((teamMember) => mentionGroup.memberNames.includes(teamMember.name))
      .map((teamMember) => teamMember.id),
  }));
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

/**
 * The current business's mention groups and the admin actions on them (E3-1).
 * Live mode reads and writes Supabase; mock mode keeps changes in this browser tab.
 */
export function useMentionGroups() {
  const { dataMode } = useDataMode();
  const { currentBusiness, teamMembers } = useCurrentUser();

  const [mentionGroups, setMentionGroups] = useState<EditableMentionGroup[]>(() =>
    dataMode === "live" ? [] : getMockMentionGroups(teamMembers),
  );
  const [isLoading, setIsLoading] = useState(dataMode === "live");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLive = dataMode === "live";

  function updateGroupMembers(groupId: string, getMemberIds: (memberIds: string[]) => string[]) {
    setMentionGroups((previousGroups) =>
      previousGroups.map((mentionGroup) =>
        mentionGroup.id === groupId ? { ...mentionGroup, memberIds: getMemberIds(mentionGroup.memberIds) } : mentionGroup,
      ),
    );
  }

  /** Throws on failure, so the form can show the message. */
  async function createGroup(mentionGroupFormValues: MentionGroupFormValues) {
    const newGroup = isLive
      ? await createMentionGroup(currentBusiness.id, mentionGroupFormValues)
      : { id: `mock-group-${crypto.randomUUID()}`, ...mentionGroupFormValues, memberIds: [] };
    setMentionGroups((previousGroups) =>
      [...previousGroups, newGroup].sort((first, second) => first.label.localeCompare(second.label)),
    );
  }

  async function deleteGroup(groupId: string) {
    setErrorMessage(null);
    try {
      if (isLive) {
        await deleteMentionGroup(groupId);
      }
      setMentionGroups((previousGroups) => previousGroups.filter((mentionGroup) => mentionGroup.id !== groupId));
    } catch (deleteError) {
      setErrorMessage(`Couldn't delete the group: ${toErrorMessage(deleteError)}`);
    }
  }

  async function addMember(groupId: string, userId: string) {
    setErrorMessage(null);
    try {
      if (isLive) {
        await addMentionGroupMember(groupId, userId);
      }
      updateGroupMembers(groupId, (memberIds) => [...memberIds, userId]);
    } catch (addError) {
      setErrorMessage(`Couldn't add them: ${toErrorMessage(addError)}`);
    }
  }

  async function removeMember(groupId: string, userId: string) {
    setErrorMessage(null);
    try {
      if (isLive) {
        await removeMentionGroupMember(groupId, userId);
      }
      updateGroupMembers(groupId, (memberIds) => memberIds.filter((memberId) => memberId !== userId));
    } catch (removeError) {
      setErrorMessage(`Couldn't remove them: ${toErrorMessage(removeError)}`);
    }
  }

  useEffect(() => {
    if (!isLive) {
      return;
    }
    let isCancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show loading while switching business
    setIsLoading(true);
    listMentionGroups(currentBusiness.id)
      .then((loadedGroups) => {
        if (!isCancelled) {
          setMentionGroups(loadedGroups);
          setErrorMessage(null);
        }
      })
      .catch((loadError) => {
        if (!isCancelled) {
          setErrorMessage(`Couldn't load the groups: ${toErrorMessage(loadError)}`);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [isLive, currentBusiness.id]);

  return { mentionGroups, isLoading, errorMessage, createGroup, deleteGroup, addMember, removeMember };
}
