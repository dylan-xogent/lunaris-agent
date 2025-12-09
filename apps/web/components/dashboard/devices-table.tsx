"use client";

import { useQuery } from "@tanstack/react-query";
import { getDevices } from "@/lib/api";
import { Device } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Monitor,
  MoreHorizontal,
  ExternalLink,
  RefreshCw,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { wsClient, WebSocketClient } from "@/lib/ws";
import { DeviceStatusChangePayload } from "@/lib/types";

function formatLastSeen(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function DeviceStatusBadge({ status }: { status: Device["status"] }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-2.5 w-2.5">
        {status === "online" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            status === "online" ? "bg-emerald-500" : "bg-slate-600"
          )}
        />
      </div>
      <span
        className={cn(
          "text-sm font-medium capitalize",
          status === "online" ? "text-emerald-400" : "text-slate-500"
        )}
      >
        {status}
      </span>
    </div>
  );
}

export function DevicesTable() {
  const [localDevices, setLocalDevices] = useState<Device[]>([]);

  const { data: devices, isLoading, refetch } = useQuery({
    queryKey: ["devices"],
    queryFn: () => getDevices(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update local state when query data changes
  useEffect(() => {
    if (devices) {
      setLocalDevices(devices);
    }
  }, [devices]);

  // Subscribe to real-time status changes
  useEffect(() => {
    const unsubscribe = wsClient.subscribe(
      "device_status_change",
      (payload: DeviceStatusChangePayload) => {
        setLocalDevices((prev) =>
          prev.map((device) =>
            device.id === payload.deviceId
              ? { ...device, status: payload.status, lastSeenAt: payload.lastSeenAt }
              : device
          )
        );
      }
    );

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800/50 bg-slate-900/50">
      <div className="flex items-center justify-between border-b border-slate-800/50 px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Devices</h3>
          <p className="text-sm text-slate-500">
            Real-time status of enrolled devices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Link href="/devices">View All</Link>
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800/50 hover:bg-transparent">
              <TableHead className="text-slate-400">Device</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">OS</TableHead>
              <TableHead className="text-slate-400">IP Address</TableHead>
              <TableHead className="text-slate-400">Updates</TableHead>
              <TableHead className="text-slate-400">Last Seen</TableHead>
              <TableHead className="w-[50px] text-slate-400"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localDevices.map((device) => (
              <TableRow
                key={device.id}
                className="border-slate-800/50 hover:bg-slate-800/30"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800">
                      <Monitor className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                      <Link
                        href={`/devices/${device.id}`}
                        className="font-medium text-white hover:text-cyan-400"
                      >
                        {device.hostname}
                      </Link>
                      <p className="text-xs text-slate-500">
                        Agent v{device.agentVersion}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <DeviceStatusBadge status={device.status} />
                </TableCell>
                <TableCell>
                  <span className="text-slate-300">{device.os}</span>
                  <p className="text-xs text-slate-500">{device.osVersion}</p>
                </TableCell>
                <TableCell className="font-mono text-sm text-slate-400">
                  {device.ipAddress}
                </TableCell>
                <TableCell>
                  {device.pendingUpdates > 0 ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-amber-400"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      {device.pendingUpdates} pending
                    </Badge>
                  ) : (
                    <span className="text-sm text-slate-500">Up to date</span>
                  )}
                </TableCell>
                <TableCell className="text-slate-400">
                  {device.lastSeenAt ? formatLastSeen(device.lastSeenAt) : "Never"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-white"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="border-slate-800 bg-slate-900"
                    >
                      <DropdownMenuItem
                        asChild
                        className="text-slate-300 focus:bg-slate-800 focus:text-white"
                      >
                        <Link href={`/devices/${device.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync Device
                      </DropdownMenuItem>
                      {device.pendingUpdates > 0 && (
                        <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white">
                          <Download className="mr-2 h-4 w-4" />
                          Install Updates
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

