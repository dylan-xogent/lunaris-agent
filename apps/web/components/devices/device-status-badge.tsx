"use client";

import { cn } from "@/lib/utils";
import { DeviceStatus } from "@/lib/types";

interface DeviceStatusBadgeProps {
  status: DeviceStatus;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function DeviceStatusBadge({
  status,
  showLabel = true,
  size = "md",
}: DeviceStatusBadgeProps) {
  const sizeClasses = {
    sm: "h-1.5 w-1.5",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  };

  const labelSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn("relative flex", sizeClasses[size])}>
        {status === "online" && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full",
            sizeClasses[size],
            status === "online" ? "bg-emerald-500" : "bg-slate-600"
          )}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            "font-medium capitalize",
            labelSizeClasses[size],
            status === "online" ? "text-emerald-400" : "text-slate-500"
          )}
        >
          {status}
        </span>
      )}
    </div>
  );
}

