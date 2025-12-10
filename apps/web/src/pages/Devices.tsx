import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import {
  Search, Filter, Monitor, MoreHorizontal, RefreshCw,
  Plus, Grid3X3, List, Download, Trash2, AlertTriangle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDevices } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

const statusConfig = {
  online: { color: "bg-success", text: "text-success", label: "Online" },
  offline: { color: "bg-muted-foreground", text: "text-muted-foreground", label: "Offline" },
  warning: { color: "bg-warning", text: "text-warning", label: "Warning" },
};

export default function Devices() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: devices = [], isLoading, error, refetch } = useQuery({
    queryKey: ["devices"],
    queryFn: () => getDevices(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const toggleDevice = (id: string) => {
    setSelectedDevices(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedDevices(prev =>
      prev.length === filteredDevices.length ? [] : filteredDevices.map(d => d.id)
    );
  };

  // Filter devices by search term
  const filteredDevices = devices.filter(device =>
    device.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.macAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <MainLayout title="Devices" subtitle="Loading devices...">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading devices...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Devices" subtitle="Error loading devices">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-2">Failed to load devices</p>
            <p className="text-muted-foreground text-sm">{(error as Error).message}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Devices" subtitle="Manage and monitor all devices running Lunaris Agent">
      <div className="space-y-6">
        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-72 pl-11 h-11 bg-secondary/50 border-border/50 rounded-xl"
              />
            </div>
            <Button variant="outline" className="h-11 gap-2 rounded-xl border-border/50 hover:border-primary/50">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-secondary/50 rounded-xl p-1">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>

            <Button
              variant="ghost"
              className="h-11 gap-2 btn-ghost"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>

            <Button className="h-11 gap-2 btn-glow">
              <Plus className="w-4 h-4" />
              Add Device
            </Button>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-6 text-sm"
        >
          <span className="text-muted-foreground">
            <strong className="text-foreground">{filteredDevices.length}</strong> total devices
          </span>
          <span className="text-muted-foreground">
            <strong className="text-success">{filteredDevices.filter(d => d.status === 'online').length}</strong> online
          </span>
          <span className="text-muted-foreground">
            <strong className="text-muted-foreground">{filteredDevices.filter(d => d.status === 'offline').length}</strong> offline
          </span>
          <span className="text-muted-foreground">
            <strong className="text-destructive">{filteredDevices.reduce((sum, d) => sum + (d.pendingUpdates || 0), 0)}</strong> pending updates
          </span>

          {selectedDevices.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-primary font-medium">{selectedDevices.length} selected</span>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
                <Download className="w-3.5 h-3.5" />
                Update
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </Button>
            </div>
          )}
        </motion.div>

        {/* Table */}
        {filteredDevices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="chart-card flex flex-col items-center justify-center py-16"
          >
            <Monitor className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">
              {searchTerm ? "No devices found" : "No devices enrolled yet"}
            </p>
            <p className="text-muted-foreground">
              {searchTerm ? "Try adjusting your search criteria" : "Install the Lunaris Agent on devices to get started"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="chart-card overflow-hidden"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="w-12 px-6 py-4">
                    <Checkbox
                      checked={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Device</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Groups & Tags</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">System</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Updates</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Seen</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device, index) => {
                  const config = statusConfig[device.status];
                  return (
                    <motion.tr
                      key={device.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className={cn(
                        "border-b border-border/20 hover:bg-secondary/30 cursor-pointer transition-colors",
                        selectedDevices.includes(device.id) && "bg-primary/5"
                      )}
                      onClick={() => navigate(`/devices/${device.id}`)}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedDevices.includes(device.id)}
                          onCheckedChange={() => toggleDevice(device.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{device.hostname}</p>
                            <p className="text-xs text-muted-foreground font-mono">{device.macAddress}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2.5 h-2.5 rounded-full", config.color, device.status === "online" && "animate-pulse")} />
                          <span className={cn("font-medium", config.text)}>{config.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {device.groups?.map((g) => (
                            <span key={g.id} className="px-2.5 py-1 text-xs rounded-lg bg-primary/10 text-primary font-medium">{g.name}</span>
                          ))}
                          {device.tags?.map((t) => (
                            <span key={t.id} className="px-2.5 py-1 text-xs rounded-lg bg-secondary text-muted-foreground">{t.name}</span>
                          ))}
                          {(!device.groups || device.groups.length === 0) && (!device.tags || device.tags.length === 0) && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-foreground">{device.os} {device.osVersion}</span>
                      </td>
                      <td className="px-6 py-4">
                        {device.pendingUpdates && device.pendingUpdates > 0 ? (
                          <span className="px-2.5 py-1 text-xs rounded-lg bg-warning/10 text-warning font-medium">
                            {device.pendingUpdates} pending
                          </span>
                        ) : (
                          <span className="text-success text-sm">Up to date</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {device.lastSeenAt ? formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true }) : 'Never'}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <button className="p-2 rounded-lg btn-ghost">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
