import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { Download, Filter, Monitor, RefreshCw, Search, AlertCircle, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedStatCard } from "@/components/dashboard/AnimatedStatCard";
import { useQuery } from "@tanstack/react-query";
import { getUpdates } from "@/lib/api";
import { Update } from "@/lib/types";
import { format } from "date-fns";
import { useState } from "react";

const severityConfig = {
  critical: { color: "bg-destructive", text: "text-destructive", bg: "bg-destructive/10" },
  important: { color: "bg-warning", text: "text-warning", bg: "bg-warning/10" },
  optional: { color: "bg-muted-foreground", text: "text-muted-foreground", bg: "bg-muted" },
};

// Group updates by package identifier to show device counts
function groupUpdatesByPackage(updates: Update[]) {
  const grouped = new Map<string, {
    packageIdentifier: string;
    packageName: string;
    severity: string;
    devices: string[];
    deviceHostnames: string[];
    currentVersion: string;
    availableVersion: string;
    source: string;
    size?: string | null;
    publishedAt?: string | null;
  }>();

  for (const update of updates) {
    const key = update.packageIdentifier || update.packageName;
    if (!grouped.has(key)) {
      grouped.set(key, {
        packageIdentifier: update.packageIdentifier || '',
        packageName: update.packageName,
        severity: update.severity || 'optional',
        devices: [],
        deviceHostnames: [],
        currentVersion: update.currentVersion || update.installedVersion || 'N/A',
        availableVersion: update.availableVersion,
        source: update.source || 'winget',
        size: update.size,
        publishedAt: update.publishedAt,
      });
    }
    const group = grouped.get(key)!;
    if (update.deviceId && !group.devices.includes(update.deviceId)) {
      group.devices.push(update.deviceId);
    }
    if (update.deviceHostname && !group.deviceHostnames.includes(update.deviceHostname)) {
      group.deviceHostnames.push(update.deviceHostname);
    }
  }

  return Array.from(grouped.values());
}

export default function Updates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { data: updatesData, isLoading, error, refetch } = useQuery<Update[]>({
    queryKey: ["updates", severityFilter, searchQuery],
    queryFn: () => getUpdates({
      severity: severityFilter === "all" ? undefined : severityFilter,
      search: searchQuery || undefined,
    }),
    refetchInterval: 60000, // Refetch every minute
  });

  const groupedUpdates = updatesData ? groupUpdatesByPackage(updatesData) : [];
  const totalUpdates = groupedUpdates.length;
  const criticalCount = groupedUpdates.filter(u => u.severity === 'critical').length;
  const importantCount = groupedUpdates.filter(u => u.severity === 'important').length;
  const optionalCount = groupedUpdates.filter(u => u.severity === 'optional').length;

  return (
    <MainLayout title="Updates" subtitle="Manage and deploy updates across your device fleet">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <AnimatedStatCard
            title="Total Updates"
            value={totalUpdates}
            subtitle="Ready to deploy"
            icon={Download}
            variant="primary"
            delay={0}
          />
          <AnimatedStatCard
            title="Critical"
            value={criticalCount}
            subtitle="Immediate action"
            icon={AlertCircle}
            variant="danger"
            delay={0.1}
          />
          <AnimatedStatCard
            title="Important"
            value={importantCount}
            subtitle="Recommended"
            icon={Clock}
            variant="warning"
            delay={0.2}
          />
          <AnimatedStatCard
            title="Optional"
            value={optionalCount}
            subtitle="When convenient"
            icon={CheckCircle2}
            variant="primary"
            delay={0.3}
          />
        </div>

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search updates..."
                className="w-72 pl-11 h-11 bg-secondary/50 border-border/50 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              className="h-11 gap-2 rounded-xl border-border/50"
              onClick={() => setSeverityFilter(severityFilter === "all" ? "critical" : severityFilter === "critical" ? "important" : severityFilter === "important" ? "optional" : "all")}
            >
              <Filter className="w-4 h-4" />
              {severityFilter === "all" ? "All Severity" : severityFilter.charAt(0).toUpperCase() + severityFilter.slice(1)}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              className="btn-ghost gap-2"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Updates List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl overflow-hidden"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Update</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Severity</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Devices</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Size</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Released</th>
                <th className="w-32"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-muted-foreground">Loading updates...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <AlertCircle className="w-8 h-8 text-destructive" />
                      <p className="text-destructive">Failed to load updates</p>
                      <Button size="sm" onClick={() => refetch()}>Retry</Button>
                    </div>
                  </td>
                </tr>
              ) : groupedUpdates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No updates available</p>
                      <p className="text-sm text-muted-foreground">All devices are up to date</p>
                    </div>
                  </td>
                </tr>
              ) : (
                groupedUpdates.map((update, index) => {
                  const config = severityConfig[update.severity as keyof typeof severityConfig] || severityConfig.optional;
                  const deviceCount = update.deviceHostnames.length || update.devices.length;
                  return (
                    <motion.tr
                      key={update.packageIdentifier || update.packageName}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className="border-b border-border/20 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                            <Download className={`w-5 h-5 ${config.text}`} />
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block">{update.packageName}</span>
                            <span className="text-xs text-muted-foreground">
                              {update.currentVersion} → {update.availableVersion}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${config.bg} ${config.text}`}>
                          <span className={`w-2 h-2 rounded-full ${config.color}`} />
                          {update.severity.charAt(0).toUpperCase() + update.severity.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Monitor className="w-4 h-4" />
                          {deviceCount} {deviceCount === 1 ? 'device' : 'devices'}
                        </span>
                        {update.deviceHostnames.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {update.deviceHostnames.slice(0, 2).join(', ')}
                            {update.deviceHostnames.length > 2 && ` +${update.deviceHostnames.length - 2} more`}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-5 text-muted-foreground font-mono text-sm">
                        {update.size || 'N/A'}
                      </td>
                      <td className="px-6 py-5 text-muted-foreground text-sm">
                        {update.publishedAt ? format(new Date(update.publishedAt), 'MMM d, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-5">
                        <Button size="sm" className="btn-glow h-9">
                          View
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </motion.div>
      </div>
    </MainLayout>
  );
}
