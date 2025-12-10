import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getDevices, getDeviceMetrics } from "@/lib/api";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl p-3 border border-border/50">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-mono font-medium text-foreground">
              {entry.value?.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface SystemMetricsChartProps {
  delay?: number;
}

export function SystemMetricsChart({ delay = 0 }: SystemMetricsChartProps) {
  // Get the first online device to fetch metrics for
  const { data: devices } = useQuery({
    queryKey: ["devices"],
    queryFn: () => getDevices({ status: "online" }),
  });

  const firstDevice = devices?.[0];

  // Fetch metrics for the first online device
  const { data: metricsData, isLoading, error } = useQuery({
    queryKey: ["device-metrics", firstDevice?.id],
    queryFn: () => getDeviceMetrics(firstDevice!.id, "24h"),
    enabled: !!firstDevice,
    refetchInterval: 60000, // Refetch every minute
  });

  // Transform the data for the chart
  const chartData = metricsData?.metrics.map((point) => ({
    time: format(new Date(point.timestamp), "HH:mm"),
    cpu: point.cpu || 0,
    memory: point.memory || 0,
  })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="chart-card"
    >
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">System Performance</h3>
            <p className="text-sm text-muted-foreground">
              {firstDevice ? `${firstDevice.hostname} - Last 24 hours` : "No devices online"}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">CPU</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-sm text-muted-foreground">Memory</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">
        {isLoading && (
          <div className="h-[280px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading metrics...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="h-[280px] flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive">Failed to load metrics</p>
            </div>
          </div>
        )}

        {!firstDevice && !isLoading && (
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-muted-foreground">No online devices to display metrics</p>
          </div>
        )}

        {chartData.length === 0 && firstDevice && !isLoading && !error && (
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-muted-foreground">No metrics data available yet</p>
          </div>
        )}

        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(175, 85%, 55%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(175, 85%, 55%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(265, 85%, 65%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(265, 85%, 65%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 20%, 18%)" vertical={false} />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(230, 10%, 55%)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(230, 10%, 55%)', fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cpu"
                name="CPU"
                stroke="hsl(175, 85%, 55%)"
                strokeWidth={2}
                fill="url(#cpuGradient)"
              />
              <Area
                type="monotone"
                dataKey="memory"
                name="Memory"
                stroke="hsl(265, 85%, 65%)"
                strokeWidth={2}
                fill="url(#memoryGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
