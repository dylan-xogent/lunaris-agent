import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getStats } from "@/lib/api";
import { AlertTriangle } from "lucide-react";

const COLORS = {
  online: "hsl(155, 75%, 50%)",
  offline: "hsl(230, 10%, 55%)",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl p-3 border border-border/50">
        <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
        <p className="text-lg font-bold text-foreground mt-1">{payload[0].value}</p>
        <p className="text-xs text-muted-foreground">devices</p>
      </div>
    );
  }
  return null;
};

interface DeviceStatusChartProps {
  delay?: number;
}

export function DeviceStatusChart({ delay = 0 }: DeviceStatusChartProps) {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const chartData = [
    { name: "Online", value: stats?.onlineDevices || 0, color: COLORS.online },
    { name: "Offline", value: stats?.offlineDevices || 0, color: COLORS.offline },
  ];

  const totalDevices = (stats?.onlineDevices || 0) + (stats?.offlineDevices || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="chart-card flex flex-col"
    >
      <div className="p-6 border-b border-border/30">
        <h3 className="text-lg font-semibold text-foreground">Device Status</h3>
        <p className="text-sm text-muted-foreground">Fleet overview</p>
      </div>
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        {isLoading && (
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        )}

        {error && (
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">Failed to load data</p>
          </div>
        )}

        {stats && totalDevices === 0 && (
          <div className="text-center">
            <p className="text-muted-foreground">No devices enrolled</p>
          </div>
        )}

        {stats && totalDevices > 0 && (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 w-full mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.online }} />
                  <span className="text-sm text-muted-foreground">Online</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {stats.onlineDevices} ({stats.onlinePercentage}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.offline }} />
                  <span className="text-sm text-muted-foreground">Offline</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {stats.offlineDevices}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
