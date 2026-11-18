import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export default function UserAvatar({ name, size = "sm", className }: UserAvatarProps) {
  return (
    <Avatar size={size} className={cn("after:border-transparent", className)} aria-hidden>
      <AvatarFallback className="bg-primary font-semibold text-primary-foreground group-data-[size=sm]/avatar:text-[10px]">
        {getNameInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
