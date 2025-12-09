"use client";

import { useQuery } from "@tanstack/react-query";
import { getDevices } from "@/lib/api";
import { Device, DevicesFilter } from "@/lib/types";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeviceStatusBadge } from "./device-status-badge";
import {
  Monitor,
  MoreHorizontal,
  ExternalLink,
  RefreshCw,
  Download,
  Search,
  Filter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useState, useMemo } from "react";

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

function formatEnrolledDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DeviceList() {
  const [filter, setFilter] = useState<DevicesFilter>({
    status: "all",
    search: "",
  });

  const { data: devices, isLoading, refetch } = useQuery({
    queryKey: ["devices", filter],
    queryFn: () => getDevices(filter),
  });

  const filteredDevices = useMemo(() => {
    if (!devices) return [];
    return devices;
  }, [devices]);

  const stats = useMemo(() => {
    if (!devices) return { total: 0, online: 0, withUpdates: 0 };
    return {
      total: devices.length,
      online: devices.filter((d) => d.status === "online").length,
      withUpdates: devices.filter((d) => d.pendingUpdates > 0).length,
    };
  }, [devices]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search devices..."
              value={filter.search}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, search: e.target.value }))
              }
              className="w-[300px] border-slate-800 bg-slate-900/50 pl-9 text-white placeholder:text-slate-500 focus:border-cyan-500/50"
            />
          </div>
          <Select
            value={filter.status || "all"}
            onValueChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                status: value as DevicesFilter["status"],
              }))
            }
          >
            <SelectTrigger className="w-[150px] border-slate-800 bg-slate-900/50 text-white">
              <Filter className="mr-2 h-4 w-4 text-slate-500" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="border-slate-800 bg-slate-900">
              <SelectItem value="all" className="text-slate-300 focus:bg-slate-800 focus:text-white">
                All Status
              </SelectItem>
              <SelectItem value="online" className="text-slate-300 focus:bg-slate-800 focus:text-white">
                Online
              </SelectItem>
              <SelectItem value="offline" className="text-slate-300 focus:bg-slate-800 focus:text-white">
                Offline
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-slate-400">
              <span className="font-semibold text-white">{stats.total}</span> total
            </span>
            <span className="text-slate-400">
              <span className="font-semibold text-emerald-400">{stats.online}</span> online
            </span>
            <span className="text-slate-400">
              <span className="font-semibold text-amber-400">{stats.withUpdates}</span> with updates
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800/50 bg-slate-900/50">
        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800/50 hover:bg-transparent">
                <TableHead className="text-slate-400">Device</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Operating System</TableHead>
                <TableHead className="text-slate-400">IP Address</TableHead>
                <TableHead className="text-slate-400">Agent</TableHead>
                <TableHead className="text-slate-400">Updates</TableHead>
                <TableHead className="text-slate-400">Last Seen</TableHead>
                <TableHead className="text-slate-400">Enrolled</TableHead>
                <TableHead className="w-[50px] text-slate-400"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map((device) => (
                <TableRow
                  key={device.id}
                  className="border-slate-800/50 hover:bg-slate-800/30"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                        <Monitor className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <Link
                          href={`/devices/${device.id}`}
                          className="font-medium text-white hover:text-cyan-400"
                        >
                          {device.hostname}
                        </Link>
                        <p className="font-mono text-xs text-slate-500">
                          {device.macAddress}
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
                    <Badge
                      variant="outline"
                      className="border-slate-700 bg-transparent text-slate-400"
                    >
                      v{device.agentVersion}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {device.pendingUpdates > 0 ? (
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 bg-amber-500/10 text-amber-400"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        {device.pendingUpdates}
                      </Badge>
                    ) : (
                      <span className="text-sm text-slate-500">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {device.lastSeenAt ? formatLastSeen(device.lastSeenAt) : "Never"}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {formatEnrolledDate(device.enrolledAt)}
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
        )}
      </div>
    </div>
  );
}

