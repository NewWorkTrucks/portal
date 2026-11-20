"use client";

import { Lock, Plus, Trash2, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import MentionGroupForm from "@/components/forms/mention-group-form";
import SettingsSection from "@/components/settings/settings-section";
import { useMentionGroups } from "@/components/settings/use-mention-groups";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserAvatar from "@/components/user-avatar";
import { LEADERSHIP_GROUP_HANDLE } from "@/constants/mention-groups";
import type { EditableMentionGroup, MentionGroupFormValues } from "@/types/mention";

const EMPTY_MENTION_GROUP_FORM_VALUES: MentionGroupFormValues = { label: "", handle: "" };

/**
 * Admins only: who is in each @group of the current business (E3-1). Mentioning a group notifies
 * everyone in it, and Leadership also gets the automatic Stuck and can't-start alerts.
 */
export default function MentionGroupsSettingsSection() {
  const { mentionGroups, isLoading, errorMessage, createGroup, deleteGroup, addMember, removeMember } =
    useMentionGroups();
  const { currentUser, teamMembers, currentBusiness } = useCurrentUser();

  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [groupPendingDelete, setGroupPendingDelete] = useState<EditableMentionGroup | null>(null);

  if (currentUser.role !== "admin") {
    return null;
  }

  const businessMembers = teamMembers.filter((teamMember) => teamMember.businessIds.includes(currentBusiness.id));
  const takenHandles = [
    ...mentionGroups.map((mentionGroup) => mentionGroup.handle),
    ...businessMembers.map((teamMember) => teamMember.mentionHandle ?? teamMember.name.replace(/\s+/g, "")),
  ];

  function getTeamMemberName(userId: string): string {
    return teamMembers.find((teamMember) => teamMember.id === userId)?.name ?? "Unknown";
  }

  async function handleSubmitNewGroup(mentionGroupFormValues: MentionGroupFormValues) {
    await createGroup(mentionGroupFormValues);
    setIsCreateFormOpen(false);
  }

  async function handleConfirmDeleteGroup() {
    if (groupPendingDelete) {
      await deleteGroup(groupPendingDelete.id);
    }
    setGroupPendingDelete(null);
  }

  return (
    <SettingsSection
      title={`Mention groups · ${currentBusiness.shortName}`}
      description="Mentioning a group notifies everyone in it. Changes apply to new notes; reload the board to see them in @ suggestions."
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading groups…</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {mentionGroups.map((mentionGroup) => {
            const isLeadershipGroup = mentionGroup.handle === LEADERSHIP_GROUP_HANDLE;
            const addableMembers = businessMembers.filter(
              (teamMember) => !mentionGroup.memberIds.includes(teamMember.id),
            );

            return (
              <li key={mentionGroup.id} className="flex flex-col gap-3 rounded-md border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium">{mentionGroup.label}</span>
                    <span className="text-xs text-muted-foreground">
                      @{mentionGroup.handle}
                      {isLeadershipGroup && " · also gets Stuck and can't-start alerts"}
                    </span>
                  </div>
                  {isLeadershipGroup ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock aria-hidden className="size-3.5" />
                      Can&rsquo;t be deleted
                    </span>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setGroupPendingDelete(mentionGroup)}>
                      <Trash2 aria-hidden />
                      Delete
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {mentionGroup.memberIds.length === 0 && (
                    <span className="text-sm text-muted-foreground">No one yet.</span>
                  )}
                  {mentionGroup.memberIds.map((memberId) => (
                    <span
                      key={memberId}
                      className="flex items-center gap-1.5 rounded-full border py-0.5 pr-1 pl-0.5 text-sm"
                    >
                      <UserAvatar name={getTeamMemberName(memberId)} />
                      {getTeamMemberName(memberId)}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="rounded-full"
                        aria-label={`Remove ${getTeamMemberName(memberId)} from ${mentionGroup.label}`}
                        onClick={() => void removeMember(mentionGroup.id, memberId)}
                      >
                        <X aria-hidden />
                      </Button>
                    </span>
                  ))}

                  {addableMembers.length > 0 && (
                    <Select
                      value={null}
                      onValueChange={(userId) => userId && void addMember(mentionGroup.id, userId as string)}
                    >
                      <SelectTrigger size="sm" aria-label={`Add a person to ${mentionGroup.label}`}>
                        <UserPlus aria-hidden />
                        <SelectValue placeholder="Add person" />
                      </SelectTrigger>
                      <SelectContent>
                        {addableMembers.map((teamMember) => (
                          <SelectItem key={teamMember.id} value={teamMember.id}>
                            <UserAvatar name={teamMember.name} className="size-5" />
                            {teamMember.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      {isCreateFormOpen ? (
        <div className="rounded-md border p-3">
          <MentionGroupForm
            initialValues={EMPTY_MENTION_GROUP_FORM_VALUES}
            takenHandles={takenHandles}
            onSubmit={handleSubmitNewGroup}
            onCancel={() => setIsCreateFormOpen(false)}
          />
        </div>
      ) : (
        <Button variant="outline" className="self-start" onClick={() => setIsCreateFormOpen(true)} disabled={isLoading}>
          <Plus aria-hidden />
          New group
        </Button>
      )}

      <AlertDialog open={groupPendingDelete !== null} onOpenChange={(isOpen) => !isOpen && setGroupPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {groupPendingDelete?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Mentioning @{groupPendingDelete?.handle} will no longer notify anyone. Earlier notes keep the text but
              won&rsquo;t link to the group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void handleConfirmDeleteGroup()}>
              <Trash2 aria-hidden />
              Delete group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  );
}
