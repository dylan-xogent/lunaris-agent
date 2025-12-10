import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedStatCardProps {
  title: string;
  value: number;
  suffix?: string;
  subtitle: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  variant?: "primary" | "success" | "warning" | "danger" | "accent";
  delay?: number;
}

const variantStyles = {
  primary: {
    iconBg: "from-primary/20 to-primary/5",
    iconColor: "text-primary",
    valueBg: "from-primary via-cyan-400 to-primary",
  },
  success: {
    iconBg: "from-success/20 to-success/5",
    iconColor: "text-success",
    valueBg: "from-success via-emerald-400 to-success",
  },
  warning: {
    iconBg: "from-warning/20 to-warning/5",
    iconColor: "text-warning",
    valueBg: "from-warning via-amber-400 to-warning",
  },
  danger: {
    iconBg: "from-destructive/20 to-destructive/5",
    iconColor: "text-destructive",
    valueBg: "from-destructive via-rose-400 to-destructive",
  },
  accent: {
    iconBg: "from-accent/20 to-accent/5",
    iconColor: "text-accent",
    valueBg: "from-accent via-purple-400 to-accent",
  },
};

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (current) => Math.round(current));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    return display.on("change", (latest) => {
      setDisplayValue(latest);
    });
  }, [display]);

  return <>{displayValue}</>;
}

export function AnimatedStatCard({
  title,
  value,
  suffix = "",
  subtitle,
  icon: Icon,
  trend,
  variant = "primary",
  delay = 0,
}: AnimatedStatCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="stat-card animated-border group"
    >
      <div className="flex items-start justify-between mb-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
          className={cn(
            "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center",
            styles.iconBg
          )}
        >
          <Icon className={cn("w-7 h-7", styles.iconColor)} />
        </motion.div>
        {trend && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.4 }}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
              trend.positive 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            )}
          >
            <span>{trend.positive ? "↑" : "↓"}</span>
            <span>{trend.value}%</span>
          </motion.div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
              styles.valueBg
            )}
          >
            <AnimatedNumber value={value} />
          </span>
          {suffix && (
            <span className="text-lg text-muted-foreground font-medium">
              {suffix}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      {/* Decorative element */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl group-hover:from-primary/10 transition-all duration-500" />
    </motion.div>
  );
}
