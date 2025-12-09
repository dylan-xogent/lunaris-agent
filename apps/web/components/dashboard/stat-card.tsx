"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const variantStyles = {
  default: {
    icon: "bg-slate-800 text-slate-300",
    value: "text-white",
  },
  success: {
    icon: "bg-emerald-500/10 text-emerald-400",
    value: "text-emerald-400",
  },
  warning: {
    icon: "bg-amber-500/10 text-amber-400",
    value: "text-amber-400",
  },
  danger: {
    icon: "bg-rose-500/10 text-rose-400",
    value: "text-rose-400",
  },
  info: {
    icon: "bg-cyan-500/10 text-cyan-400",
    value: "text-cyan-400",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-slate-800/50 bg-slate-900/50 p-6 transition-all hover:border-slate-700/50 hover:bg-slate-900/80",
        className
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className={cn("mt-2 text-3xl font-bold tracking-tight", styles.value)}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-3 flex items-center gap-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.positive ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {trend.positive ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-sm text-slate-500">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn("rounded-lg p-3", styles.icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

