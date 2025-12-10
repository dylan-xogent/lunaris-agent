import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  variant?: "default" | "success" | "warning" | "danger";
  showValue?: boolean;
  label?: string;
  className?: string;
}

const variantColors = {
  default: "from-primary to-cyan-400",
  success: "from-success to-emerald-400",
  warning: "from-warning to-amber-400",
  danger: "from-destructive to-rose-400",
};

export function ProgressBar({ 
  value, 
  variant = "default", 
  showValue = false, 
  label,
  className 
}: ProgressBarProps) {
  const getVariant = (val: number): "default" | "success" | "warning" | "danger" => {
    if (val > 80) return "danger";
    if (val > 60) return "warning";
    return "success";
  };

  const finalVariant = variant === "default" ? getVariant(value) : variant;

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showValue && (
            <span className="font-mono font-medium text-foreground">
              {value.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className="progress-bar">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("progress-fill bg-gradient-to-r", variantColors[finalVariant])}
        />
      </div>
    </div>
  );
}
