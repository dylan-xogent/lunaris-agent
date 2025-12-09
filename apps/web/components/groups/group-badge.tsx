import type { GroupInfo } from "@/lib/types";

interface GroupBadgeProps {
  group: GroupInfo;
  className?: string;
}

export function GroupBadge({ group, className = "" }: GroupBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}
      style={{
        backgroundColor: (group.color || "#3B82F6") + "20",
        color: group.color || "#3B82F6",
      }}
    >
      {group.name}
    </span>
  );
}
