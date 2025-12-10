import { motion } from "framer-motion";
import {
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Download,
  UserPlus,
  RefreshCw,
  XCircle,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getRecentEvents } from "@/lib/api";
import { ActivityEventType } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

const typeConfig: Record<ActivityEventType, { icon: typeof Monitor; iconBg: string; iconColor: string }> = {
  device_online: {
    icon: Monitor,
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  device_offline: {
    icon: XCircle,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
  },
  device_enrolled: {
    icon: UserPlus,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  device_updated: {
    icon: RefreshCw,
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  update_installed: {
    icon: CheckCircle2,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  update_failed: {
    icon: XCircle,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
  },
  group_created: {
    icon: UserPlus,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
  group_updated: {
    icon: RefreshCw,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
  tag_created: {
    icon: Shield,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
  command_executed: {
    icon: CheckCircle2,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  bulk_operation: {
    icon: RefreshCw,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
};

interface ActivityFeedProps {
  delay?: number;
}

export function ActivityFeed({ delay = 0 }: ActivityFeedProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["recent-events"],
    queryFn: () => getRecentEvents(20),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="chart-card h-full flex flex-col"
    >
      <div className="p-6 border-b border-border/30 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Activity Feed</h3>
          <p className="text-sm text-muted-foreground">Recent system events</p>
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-2 h-2 rounded-full bg-success"
        />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading && (
          <div className="p-6 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading events...</p>
          </div>
        )}

        {error && (
          <div className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">Failed to load events</p>
          </div>
        )}

        {data && data.events.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        )}

        {data && data.events.length > 0 && (
          <div className="p-4 space-y-1">
            {data.events.map((activity, index) => {
              const config = typeConfig[activity.type];
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.1 + index * 0.08 }}
                  className="activity-item"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", config.iconBg)}>
                    <config.icon className={cn("w-5 h-5", config.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-border/30">
        <button className="w-full py-2.5 text-sm font-medium text-primary hover:bg-primary/5 rounded-xl transition-colors">
          View All Activity
        </button>
      </div>
    </motion.div>
  );
}
