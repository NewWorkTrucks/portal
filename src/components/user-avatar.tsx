"use client";

import { useContext } from "react";
import { CurrentUserContext } from "@/components/current-user-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name: string;
  size?: "sm" | "default" | "lg";
  className?: string;
};

function getNameInitials(name: string): string {
  return name
    .split(" ")
    .map((namePart) => namePart.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
}

/** A person's profile photo, or their initials until a photo is uploaded (or while it loads). */
export default function UserAvatar({ name, size = "sm", className }: UserAvatarProps) {
  // Optional: outside the portal (e.g. sign-in) there is no team, so initials only.
  const currentUserContext = useContext(CurrentUserContext);

  const photoUrl = currentUserContext?.teamMembers.find((teamMember) => teamMember.name === name)?.photoUrl;

  return (
    <Avatar size={size} className={cn("after:border-transparent", className)} aria-hidden>
      {photoUrl && <AvatarImage src={photoUrl} alt="" />}
      <AvatarFallback className="bg-primary font-semibold text-primary-foreground group-data-[size=sm]/avatar:text-[10px]">
        {getNameInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
