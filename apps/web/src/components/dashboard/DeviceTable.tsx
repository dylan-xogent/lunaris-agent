import { motion } from "framer-motion";
import { Monitor, MoreHorizontal, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Device {
  id: string;
  name: string;
  agentVersion: string;
  status: "online" | "offline";
  os: string;
  osVersion: string;
  ip: string;
  updates: string;
  lastSeen: string;
}

const mockDevices: Device[] = [
  {
    id: "1",
    name: "DT-DYLAN-PRO",
    agentVersion: "v1.0.0",
    status: "online",
    os: "Windows",
    osVersion: "10/11",
    ip: "192.168.5.2",
    updates: "Up to date",
    lastSeen: "Just now",
  },
  {
    id: "2",
    name: "LAPTOP-DEV-01",
    agentVersion: "v1.0.0",
    status: "online",
    os: "macOS",
    osVersion: "14.2",
    ip: "192.168.5.15",
    updates: "2 pending",
    lastSeen: "2 min ago",
  },
  {
    id: "3",
    name: "SERVER-PROD-01",
    agentVersion: "v0.9.8",
    status: "offline",
    os: "Ubuntu",
    osVersion: "22.04",
    ip: "192.168.5.100",
    updates: "Critical",
    lastSeen: "2 hours ago",
  },
];

export function DeviceTable() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border/50">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Devices</h2>
          <p className="text-sm text-muted-foreground">Real-time status of enrolled devices</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="btn-ghost gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/devices')}
            className="border-border/50 hover:border-primary/50 hover:bg-primary/5"
          >
            View All
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Device</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">OS</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">IP Address</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Updates</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Seen</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {mockDevices.map((device, index) => (
              <motion.tr
                key={device.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="table-row cursor-pointer"
                onClick={() => navigate(`/devices/${device.id}`)}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{device.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{device.agentVersion}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`status-dot ${device.status === 'online' ? 'status-online' : 'status-offline'}`} />
                    <span className={device.status === 'online' ? 'text-success' : 'text-muted-foreground'}>
                      {device.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-foreground">{device.os}</span>
                  <span className="text-muted-foreground ml-1">{device.osVersion}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="font-mono text-sm text-muted-foreground">{device.ip}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={
                    device.updates === 'Up to date' 
                      ? 'text-success' 
                      : device.updates === 'Critical' 
                        ? 'text-destructive' 
                        : 'text-warning'
                  }>
                    {device.updates}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {device.lastSeen}
                </td>
                <td className="px-5 py-4">
                  <button className="p-1.5 rounded-lg btn-ghost">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
