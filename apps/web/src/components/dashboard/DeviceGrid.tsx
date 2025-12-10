import { motion } from "framer-motion";
import { Monitor, Wifi, WifiOff, Cpu, HardDrive, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDevices } from "@/lib/api";

const statusConfig = {
  online: { color: "bg-success", ring: "ring-success/30", text: "text-success" },
  offline: { color: "bg-muted-foreground", ring: "ring-muted/30", text: "text-muted-foreground" },
};

function MiniProgressBar({ value, variant }: { value: number; variant: "cpu" | "memory" }) {
  const getColor = () => {
    if (value > 80) return "bg-destructive";
    if (value > 60) return "bg-warning";
    return variant === "cpu" ? "bg-primary" : "bg-accent";
  };

  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay: 0.5 }}
        className={cn("h-full rounded-full", getColor())}
      />
    </div>
  );
}

interface DeviceGridProps {
  delay?: number;
}

export function DeviceGrid({ delay = 0 }: DeviceGridProps) {
  const navigate = useNavigate();

  const { data: devices, isLoading, error } = useQuery({
    queryKey: ["devices"],
    queryFn: () => getDevices(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="chart-card"
    >
      <div className="p-6 border-b border-border/30 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Active Devices</h3>
          <p className="text-sm text-muted-foreground">Monitor your fleet in real-time</p>
        </div>
        <button onClick={() => navigate("/devices")} className="btn-ghost text-sm">
          View All
        </button>
      </div>
      <div className="p-6">
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading devices...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-2">Failed to load devices</p>
            <p className="text-muted-foreground text-sm">{(error as Error).message}</p>
          </div>
        )}

        {devices && devices.length === 0 && (
          <div className="text-center py-12">
            <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No devices enrolled yet</p>
          </div>
        )}

        {devices && devices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {devices.slice(0, 10).map((device, index) => {
              const config = statusConfig[device.status];
              return (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: delay + 0.1 + index * 0.05 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => navigate(`/devices/${device.id}`)}
                  className="glass rounded-xl p-4 cursor-pointer group hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="relative">
                      <span
                        className={cn(
                          "w-3 h-3 rounded-full block ring-4",
                          config.color,
                          config.ring,
                          device.status === "online" && "animate-pulse"
                        )}
                      />
                    </div>
                  </div>

                  <h4 className="font-semibold text-foreground text-sm truncate mb-1 group-hover:text-primary transition-colors">
                    {device.hostname}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">{device.os}</p>

                  {device.status === "online" && (
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Cpu className="w-3 h-3" /> CPU
                          </span>
                          <span className="font-mono text-foreground">
                            {device.cpuUsage || 0}%
                          </span>
                        </div>
                        <MiniProgressBar value={device.cpuUsage || 0} variant="cpu" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <HardDrive className="w-3 h-3" /> RAM
                          </span>
                          <span className="font-mono text-foreground">
                            {device.memoryUsage || 0}%
                          </span>
                        </div>
                        <MiniProgressBar value={device.memoryUsage || 0} variant="memory" />
                      </div>
                    </div>
                  )}

                  {device.status === "offline" && (
                    <div className="flex items-center justify-center py-4 text-muted-foreground">
                      <WifiOff className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                    <span className="text-xs text-muted-foreground font-mono">
                      {device.ipAddress || "N/A"}
                    </span>
                    <span className={cn("text-xs", config.text)}>
                      {device.lastSeenAt
                        ? new Date(device.lastSeenAt).toLocaleTimeString()
                        : "Never"}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
