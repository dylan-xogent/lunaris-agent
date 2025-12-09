"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Device, DevicesFilter, Group, Tag } from "@/lib/types";
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
import { GroupBadge } from "@/components/groups/group-badge";
import { TagBadge } from "@/components/tags/tag-badge";
import {
  Monitor,
  MoreHorizontal,
  ExternalLink,
  RefreshCw,
  Download,
  Search,
  Filter,
  Users,
  Tag as TagIcon,
  CheckSquare,
  Square,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

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

export function DeviceListEnhanced() {
  const [filter, setFilter] = useState<DevicesFilter>({
    status: "all",
    search: "",
  });
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkGroupId, setBulkGroupId] = useState("");
  const [bulkTagIds, setBulkTagIds] = useState<string[]>([]);

  const { data: devices, isLoading, refetch } = useQuery({
    queryKey: ["devices", filter],
    queryFn: () => api.devices.getAll(filter),
  });

  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: () => api.groups.getAll(),
  });

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.tags.getAll(),
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

  const toggleDevice = (deviceId: string) => {
    const newSelected = new Set(selectedDevices);
    if (newSelected.has(deviceId)) {
      newSelected.delete(deviceId);
    } else {
      newSelected.add(deviceId);
    }
    setSelectedDevices(newSelected);
  };

  const toggleAll = () => {
    if (selectedDevices.size === filteredDevices.length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(filteredDevices.map((d) => d.id)));
    }
  };

  const handleBulkAddToGroup = async () => {
    if (!bulkGroupId || selectedDevices.size === 0) return;
    try {
      await api.bulk.addToGroup({
        deviceIds: Array.from(selectedDevices),
        groupId: bulkGroupId,
      });
      alert("Devices added to group successfully!");
      setSelectedDevices(new Set());
      setShowBulkActions(false);
      refetch();
    } catch (error) {
      alert("Failed to add devices to group: " + (error as Error).message);
    }
  };

  const handleBulkAddTags = async () => {
    if (bulkTagIds.length === 0 || selectedDevices.size === 0) return;
    try {
      await api.bulk.addTags({
        deviceIds: Array.from(selectedDevices),
        tagIds: bulkTagIds,
      });
      alert("Tags added to devices successfully!");
      setSelectedDevices(new Set());
      setShowBulkActions(false);
      refetch();
    } catch (error) {
      alert("Failed to add tags to devices: " + (error as Error).message);
    }
  };

  const selectedCount = selectedDevices.size;

  return (
    <div className="space-y-6">
      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <Card className="bg-cyan-500/10 border-cyan-500/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-cyan-400 font-medium">
                {selectedCount} device{selectedCount !== 1 ? "s" : ""} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
              >
                Bulk Actions
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDevices(new Set())}
              className="text-slate-400 hover:text-white"
            >
              Clear Selection
            </Button>
          </div>

          {showBulkActions && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-cyan-500/20">
              {/* Bulk Add to Group */}
              <div className="space-y-2">
                <Label className="text-white">Add to Group</Label>
                <div className="flex gap-2">
                  <Select value={bulkGroupId} onValueChange={setBulkGroupId}>
                    <SelectTrigger className="flex-1 bg-slate-900 border-slate-700">
                      <SelectValue placeholder="Select group..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {groups?.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleBulkAddToGroup}
                    disabled={!bulkGroupId}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Bulk Add Tags */}
              <div className="space-y-2">
                <Label className="text-white">Add Tags</Label>
                <div className="flex gap-2">
                  <div className="flex-1 flex flex-wrap gap-1 p-2 bg-slate-900 border border-slate-700 rounded-md min-h-[38px]">
                    {bulkTagIds.map((tagId) => {
                      const tag = tags?.find((t) => t.id === tagId);
                      return tag ? (
                        <TagBadge key={tag.id} tag={tag} />
                      ) : null;
                    })}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <TagIcon className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-900 border-slate-700">
                      {tags?.map((tag) => (
                        <DropdownMenuItem
                          key={tag.id}
                          onClick={() => {
                            if (!bulkTagIds.includes(tag.id)) {
                              setBulkTagIds([...bulkTagIds, tag.id]);
                            }
                          }}
                        >
                          <TagBadge tag={tag} />
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    onClick={handleBulkAddTags}
                    disabled={bulkTagIds.length === 0}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

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
                <TableHead className="w-[50px]">
                  <button onClick={toggleAll} className="text-slate-400 hover:text-white">
                    {selectedDevices.size === filteredDevices.length && filteredDevices.length > 0 ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="text-slate-400">Device</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Groups & Tags</TableHead>
                <TableHead className="text-slate-400">Operating System</TableHead>
                <TableHead className="text-slate-400">Updates</TableHead>
                <TableHead className="text-slate-400">Last Seen</TableHead>
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
                    <button
                      onClick={() => toggleDevice(device.id)}
                      className="text-slate-400 hover:text-white"
                    >
                      {selectedDevices.has(device.id) ? (
                        <CheckSquare className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </TableCell>
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
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {device.groups?.map((group) => (
                        <GroupBadge key={group.id} group={group} />
                      ))}
                      {device.tags?.map((tag) => (
                        <TagBadge key={tag.id} tag={tag} />
                      ))}
                      {(!device.groups?.length && !device.tags?.length) && (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-300">{device.os}</span>
                    <p className="text-xs text-slate-500">{device.osVersion}</p>
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
