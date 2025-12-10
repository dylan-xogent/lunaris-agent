import { MainLayout } from "@/components/layout/MainLayout";
import { AnimatedStatCard } from "@/components/dashboard/AnimatedStatCard";
import { SystemMetricsChart } from "@/components/dashboard/SystemMetricsChart";
import { DeviceStatusChart } from "@/components/dashboard/DeviceStatusChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DeviceGrid } from "@/components/dashboard/DeviceGrid";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Monitor, Wifi, AlertTriangle, Download, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getStats } from "@/lib/api";

export default function Dashboard() {
  // Fetch real stats from API
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <MainLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Dashboard" subtitle="Error loading dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-destructive mb-2">Failed to load dashboard data</p>
            <p className="text-muted-foreground text-sm">{(error as Error).message}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard" subtitle="Welcome back! Here's what's happening with your fleet.">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <AnimatedStatCard
            title="Total Devices"
            value={stats?.totalDevices || 0}
            subtitle="Enrolled in fleet"
            icon={Monitor}
            variant="primary"
            delay={0}
          />
          <AnimatedStatCard
            title="Online"
            value={stats?.onlineDevices || 0}
            subtitle={`${stats?.onlinePercentage || 0}% availability`}
            icon={Wifi}
            trend={
              stats?.onlinePercentage
                ? { value: stats.onlinePercentage, positive: stats.onlinePercentage >= 80 }
                : undefined
            }
            variant="success"
            delay={0.1}
          />
          <AnimatedStatCard
            title="Offline"
            value={stats?.offlineDevices || 0}
            subtitle="Need attention"
            icon={AlertTriangle}
            variant={stats?.offlineDevices && stats.offlineDevices > 0 ? "warning" : "success"}
            delay={0.2}
          />
          <AnimatedStatCard
            title="Pending Updates"
            value={stats?.totalPendingUpdates || 0}
            subtitle="Ready to deploy"
            icon={Download}
            variant="accent"
            delay={0.3}
          />
          <AnimatedStatCard
            title="Health Score"
            value={stats?.healthScore || 0}
            suffix="%"
            subtitle="Fleet health"
            icon={Shield}
            variant={
              stats?.healthScore
                ? stats.healthScore >= 90
                  ? "success"
                  : stats.healthScore >= 70
                  ? "warning"
                  : "danger"
                : "success"
            }
            delay={0.4}
          />
          <AnimatedStatCard
            title="Uptime"
            value={stats?.uptime || 0}
            suffix="%"
            subtitle="Fleet availability"
            icon={Zap}
            variant="primary"
            delay={0.5}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SystemMetricsChart delay={0.3} />
          </div>
          <DeviceStatusChart delay={0.4} />
        </div>

        {/* Quick Actions */}
        <QuickActions delay={0.5} />

        {/* Device Grid */}
        <DeviceGrid delay={0.6} />

        {/* Activity Feed - Full Width */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityFeed delay={0.7} />

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="chart-card flex flex-col"
          >
            <div className="p-6 border-b border-border/30">
              <h3 className="text-lg font-semibold text-foreground">System Health</h3>
              <p className="text-sm text-muted-foreground">Overall fleet performance</p>
            </div>
            <div className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, type: "spring", stiffness: 200 }}
                  className="relative w-48 h-48 mx-auto mb-6"
                >
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="hsl(230, 20%, 15%)"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="url(#healthGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: (stats?.healthScore || 0) / 100 }}
                      transition={{ duration: 1.5, delay: 1.2, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(175, 85%, 55%)" />
                        <stop offset="100%" stopColor="hsl(155, 75%, 50%)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold gradient-text">
                      {stats?.healthScore || 0}
                    </span>
                    <span className="text-muted-foreground text-sm">Health Score</span>
                  </div>
                </motion.div>
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-muted-foreground">
                      Online: {stats?.onlineDevices || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-warning" />
                    <span className="text-muted-foreground">
                      Offline: {stats?.offlineDevices || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
