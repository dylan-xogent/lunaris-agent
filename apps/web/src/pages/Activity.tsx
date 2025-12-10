import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import {
  Monitor, CheckCircle2, AlertTriangle, Download, UserPlus,
  RefreshCw, XCircle, Shield, Filter, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getEvents } from "@/lib/api";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { useState } from "react";
import { ActivityEventType } from "@/lib/types";

const typeConfig: Record<ActivityEventType, { icon: typeof Monitor; iconBg: string; iconColor: string }> = {
  device_online: { icon: Monitor, iconBg: "bg-success/10", iconColor: "text-success" },
  device_offline: { icon: XCircle, iconBg: "bg-destructive/10", iconColor: "text-destructive" },
  device_enrolled: { icon: UserPlus, iconBg: "bg-primary/10", iconColor: "text-primary" },
  device_updated: { icon: RefreshCw, iconBg: "bg-success/10", iconColor: "text-success" },
  update_installed: { icon: CheckCircle2, iconBg: "bg-primary/10", iconColor: "text-primary" },
  update_failed: { icon: XCircle, iconBg: "bg-destructive/10", iconColor: "text-destructive" },
  group_created: { icon: UserPlus, iconBg: "bg-accent/10", iconColor: "text-accent" },
  group_updated: { icon: RefreshCw, iconBg: "bg-accent/10", iconColor: "text-accent" },
  tag_created: { icon: Shield, iconBg: "bg-accent/10", iconColor: "text-accent" },
  command_executed: { icon: CheckCircle2, iconBg: "bg-primary/10", iconColor: "text-primary" },
  bulk_operation: { icon: RefreshCw, iconBg: "bg-accent/10", iconColor: "text-accent" },
};

export default function Activity() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: () => getEvents({ limit: 100 }),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Filter events by search term
  const filteredEvents = data?.events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.deviceName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Group events by date
  const groupedEvents: { [key: string]: typeof filteredEvents } = {};
  filteredEvents.forEach(event => {
    const eventDate = new Date(event.createdAt);
    let dateLabel: string;

    if (isToday(eventDate)) {
      dateLabel = "Today";
    } else if (isYesterday(eventDate)) {
      dateLabel = "Yesterday";
    } else {
      dateLabel = format(eventDate, "MMMM d, yyyy");
    }

    if (!groupedEvents[dateLabel]) {
      groupedEvents[dateLabel] = [];
    }
    groupedEvents[dateLabel].push(event);
  });

  if (isLoading) {
    return (
      <MainLayout title="Activity" subtitle="Loading events...">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading activity...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Activity" subtitle="Error loading events">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-2">Failed to load activity</p>
            <p className="text-muted-foreground text-sm">{(error as Error).message}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Activity" subtitle="View all system events and actions">
      <div className="space-y-6">
        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-11 bg-secondary/50 border-border/50 rounded-xl"
            />
          </div>
          <Button variant="outline" className="h-11 gap-2 rounded-xl border-border/50" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </motion.div>

        {/* Activity Timeline */}
        {filteredEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl flex flex-col items-center justify-center py-16"
          >
            <Monitor className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">
              {searchTerm ? "No events found" : "No activity yet"}
            </p>
            <p className="text-muted-foreground">
              {searchTerm ? "Try adjusting your search criteria" : "Activity will appear here as events occur"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl"
          >
            <div className="divide-y divide-border/30">
              {Object.entries(groupedEvents).map(([dateLabel, events], groupIndex) => (
                <div key={dateLabel}>
                  <div className="px-6 py-3 bg-secondary/30 sticky top-0 z-10">
                    <span className="text-sm font-semibold text-muted-foreground">{dateLabel}</span>
                  </div>
                  {events.map((event, index) => {
                    const config = typeConfig[event.type];
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + (groupIndex * 0.05) + (index * 0.03) }}
                        className="flex items-start gap-4 p-6 hover:bg-secondary/20 transition-colors cursor-pointer"
                      >
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", config.iconBg)}>
                          <config.icon className={cn("w-6 h-6", config.iconColor)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-foreground">{event.title}</p>
                              {event.description && (
                                <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
                              )}
                              {event.deviceName && (
                                <span className="inline-block mt-2 px-2.5 py-1 text-xs rounded-lg bg-secondary text-muted-foreground font-mono">
                                  {event.deviceName}
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
