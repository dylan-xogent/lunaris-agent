import type { TagInfo } from "@/lib/types";

interface TagBadgeProps {
  tag: TagInfo;
  className?: string;
}

export function TagBadge({ tag, className = "" }: TagBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: (tag.color || "#10B981") + "20",
        color: tag.color || "#10B981",
      }}
    >
      {tag.name}
    </span>
  );
}
