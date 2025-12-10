import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import {
  ArrowLeft, Monitor, RefreshCw, Globe, Shield, Clock, Calendar,
  Cpu, HardDrive, Network, Power, Terminal, Settings, MoreVertical,
  Activity, Download, CheckCircle2, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDevice, getDeviceMetrics, getDeviceUpdates, syncDevice, installUpdates, getDeviceCommands } from "@/lib/api";
import { formatDistanceToNow, format } from "date-fns";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { CommandStatus } from "@/components/device/CommandStatus";

function MiniChart({ data, color }: { data: any[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${color})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MetricCard({ label, value, unit, icon: Icon, color, data }: any) {
  const getColor = (val: number) => {
    if (val > 80) return "text-destructive";
    if (val > 60) return "text-warning";
    return "text-success";
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass rounded-2xl p-5 group hover:border-primary/30 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <span className={`text-2xl font-bold font-mono ${getColor(value)}`}>
          {value}<span className="text-sm text-muted-foreground">{unit}</span>
        </span>
      </div>
      <MiniChart data={data} color={color} />
    </motion.div>
  );
}

export default function DeviceDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [activeCommands, setActiveCommands] = useState<Array<{
    id: string;
    type: "sync" | "install";
    status: "pending" | "executing" | "completed" | "failed";
    message: string;
    timestamp: Date;
    packageCount?: number;
  }>>([]);

  const { data: device, isLoading, error } = useQuery({
    queryKey: ["device", id],
    queryFn: () => getDevice(id!),
    enabled: !!id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: metricsData } = useQuery({
    queryKey: ["device-metrics", id],
    queryFn: () => getDeviceMetrics(id!, "1h"),
    enabled: !!id && device?.status === "online",
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: updatesData } = useQuery({
    queryKey: ["device-updates", id],
    queryFn: () => getDeviceUpdates(id!),
    enabled: !!id,
    refetchInterval: 60000,
  });

  const { data: commandsData } = useQuery({
    queryKey: ["device-commands", id],
    queryFn: () => getDeviceCommands(id!),
    enabled: !!id,
    refetchInterval: 5000, // Poll every 5 seconds for active commands
  });

  // Update active commands state when commands data changes
  useEffect(() => {
    if (commandsData) {
      const mapped = commandsData.map((cmd) => ({
        id: cmd.id,
        type: cmd.type === "run_scan" ? "sync" as const : "install" as const,
        status: cmd.status as "pending" | "executing" | "completed" | "failed",
        message: cmd.status === "pending" 
          ? "Command queued, waiting for agent..."
          : cmd.status === "executing"
            ? cmd.type === "run_scan" 
              ? "Scanning for updates..."
              : `Installing ${cmd.packageIdentifiers.length} update(s)...`
            : cmd.status === "completed"
              ? cmd.result || (cmd.type === "run_scan" ? "Sync completed successfully" : "Installation completed successfully")
              : cmd.result || "Command failed",
        timestamp: new Date(cmd.createdAt),
        packageCount: cmd.packageIdentifiers?.length,
      }));
      setActiveCommands(mapped);
    }
  }, [commandsData]);

  const handleSync = async () => {
    if (!id || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await syncDevice(id);
      
      toast({
        title: "Sync Command Sent",
        description: "Device sync has been queued. The agent will scan for updates shortly.",
      });

      // Refetch commands to show in status section
      queryClient.invalidateQueries({ queryKey: ["device-commands", id] });
      
      // Refetch updates after a short delay to allow agent to scan
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["device-updates", id] });
        queryClient.invalidateQueries({ queryKey: ["device", id] });
      }, 2000);
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: (error as Error).message || "Failed to send sync command",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInstallAll = async () => {
    if (!id || !updatesData || updatesData.length === 0 || isInstalling) return;
    
    setIsInstalling(true);
    try {
      const packageIdentifiers = updatesData.map((update: any) => update.packageIdentifier).filter(Boolean);
      const result = await installUpdates(id, packageIdentifiers);
      
      toast({
        title: "Installation Started",
        description: `Installation command queued for ${packageIdentifiers.length} update(s). The agent will begin installation shortly.`,
      });

      // Refetch commands to show in status section
      queryClient.invalidateQueries({ queryKey: ["device-commands", id] });
      
      // Refetch updates after installation starts
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["device-updates", id] });
        queryClient.invalidateQueries({ queryKey: ["device", id] });
      }, 2000);
    } catch (error) {
      toast({
        title: "Installation Failed",
        description: (error as Error).message || "Failed to send installation command",
        variant: "destructive",
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismissCommand = (commandId: string) => {
    setActiveCommands((prev) => prev.filter((cmd) => cmd.id !== commandId));
  };

  if (isLoading) {
    return (
      <MainLayout title="Device Details" subtitle="Loading device...">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading device details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !device) {
    return (
      <MainLayout title="Device Details" subtitle="Error loading device">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-2">Failed to load device</p>
            <p className="text-muted-foreground text-sm">
              {(error as Error)?.message || "Device not found"}
            </p>
            <Button onClick={() => navigate('/devices')} className="mt-4">
              Back to Devices
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Transform metrics data for charts
  const cpuData = metricsData?.metrics.slice(-20).map((m, i) => ({
    time: i,
    value: m.cpu || 0,
  })) || Array.from({ length: 20 }, (_, i) => ({ time: i, value: device.cpuUsage || 0 }));

  const memoryData = metricsData?.metrics.slice(-20).map((m, i) => ({
    time: i,
    value: m.memory || 0,
  })) || Array.from({ length: 20 }, (_, i) => ({ time: i, value: device.memoryUsage || 0 }));

  const diskData = metricsData?.metrics.slice(-20).map((m, i) => ({
    time: i,
    value: m.disk || 0,
  })) || Array.from({ length: 20 }, (_, i) => ({ time: i, value: device.diskUsage || 0 }));

  return (
    <MainLayout title="Device Details" subtitle={device.hostname}>
      <div className="space-y-6">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/devices')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Devices
        </motion.button>

        {/* Device Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
              >
                <Monitor className="w-8 h-8 text-primary" />
              </motion.div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-foreground">{device.hostname}</h2>
                  <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${device.status === 'online'
                      ? 'bg-success/10 text-success'
                      : 'bg-muted text-muted-foreground'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-success animate-pulse' : 'bg-muted-foreground'
                      }`} />
                    {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                  </span>
                </div>
                <p className="text-muted-foreground font-mono text-sm">
                  {device.macAddress} • {device.ipAddress || 'No IP'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="btn-ghost gap-2">
                <Terminal className="w-4 h-4" />
                Console
              </Button>
              <Button variant="ghost" className="btn-ghost gap-2">
                <Settings className="w-4 h-4" />
                Configure
              </Button>
              <Button 
                className="btn-glow gap-2"
                onClick={handleSync}
                disabled={isSyncing || device?.status !== "online"}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync Now"}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Globe, label: "Operating System", value: `${device.os} ${device.osVersion}` },
            { icon: Shield, label: "Agent Version", value: device.agentVersion, badge: "Active" },
            { icon: Clock, label: "Last Seen", value: device.lastSeenAt ? formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true }) : 'Never' },
            { icon: Calendar, label: "Enrolled", value: device.enrolledAt ? format(new Date(device.enrolledAt), "MMM d, yyyy, h:mm a") : 'Unknown' },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="font-semibold text-foreground">{item.value}</p>
                  {item.badge && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-md bg-success/10 text-success">
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* System Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">System Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="CPU Usage"
              value={device.cpuUsage?.toFixed(1) || 0}
              unit="%"
              icon={Cpu}
              color="hsl(175, 85%, 55%)"
              data={cpuData}
            />
            <MetricCard
              label="Memory Usage"
              value={device.memoryUsage || 0}
              unit="%"
              icon={Activity}
              color="hsl(265, 85%, 65%)"
              data={memoryData}
            />
            <MetricCard
              label="Disk Usage"
              value={device.diskUsage?.toFixed(1) || 0}
              unit="%"
              icon={HardDrive}
              color="hsl(155, 75%, 50%)"
              data={diskData}
            />
          </div>
        </motion.div>

        {/* Command Status Section */}
        {activeCommands.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <CommandStatus 
              commands={activeCommands}
              onDismiss={handleDismissCommand}
            />
          </motion.div>
        )}

        {/* Updates Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl"
        >
          <div className="p-6 border-b border-border/30 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Available Updates</h3>
              <p className="text-sm text-muted-foreground">Pending updates for this device</p>
            </div>
            {updatesData && updatesData.length > 0 && (
              <Button 
                variant="ghost" 
                className="btn-ghost gap-2"
                onClick={handleInstallAll}
                disabled={isInstalling || device?.status !== "online"}
              >
                <Download className={`w-4 h-4 ${isInstalling ? "animate-spin" : ""}`} />
                {isInstalling ? `Installing...` : `Install All (${updatesData.length})`}
              </Button>
            )}
          </div>
          <div className="p-12 flex flex-col items-center justify-center text-center">
            {!updatesData || updatesData.length === 0 ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4"
                >
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </motion.div>
                <p className="text-xl font-semibold text-foreground">All up to date</p>
                <p className="text-sm text-muted-foreground mt-1">This device has no pending updates</p>
              </>
            ) : (
              <div className="w-full text-left space-y-3">
                {updatesData.slice(0, 5).map((update: any, i: number) => (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">{update.packageName}</p>
                      <p className="text-sm text-muted-foreground">
                        {update.installedVersion || update.currentVersion || 'N/A'} → {update.availableVersion}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${update.severity === 'critical'
                        ? 'bg-destructive/10 text-destructive'
                        : update.severity === 'important'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-primary/10 text-primary'
                      }`}>
                      {update.severity}
                    </span>
                  </motion.div>
                ))}
                {updatesData.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground pt-2">
                    +{updatesData.length - 5} more updates
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
