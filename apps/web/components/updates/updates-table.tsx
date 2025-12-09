"use client";

import { useQuery } from "@tanstack/react-query";
import { getUpdates, getDevices } from "@/lib/api";
import { Update, UpdatesFilter, UpdateSeverity } from "@/lib/types";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Monitor,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2,
  Download,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    label: "Critical",
    className: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    dotColor: "bg-rose-500",
  },
  important: {
    icon: Info,
    label: "Important",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dotColor: "bg-amber-500",
  },
  optional: {
    icon: CheckCircle2,
    label: "Optional",
    className: "border-slate-500/30 bg-slate-500/10 text-slate-400",
    dotColor: "bg-slate-500",
  },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function UpdatesTable() {
  const [filter, setFilter] = useState<UpdatesFilter>({
    severity: "all",
    deviceId: undefined,
    search: "",
  });

  const { data: updates, isLoading: updatesLoading, refetch } = useQuery({
    queryKey: ["updates", filter],
    queryFn: () => getUpdates(filter),
  });

  const { data: devices } = useQuery({
    queryKey: ["devices-for-filter"],
    queryFn: () => getDevices(),
  });

  const stats = useMemo(() => {
    if (!updates) return { total: 0, critical: 0, important: 0, optional: 0 };
    return {
      total: updates.length,
      critical: updates.filter((u) => u.severity === "critical").length,
      important: updates.filter((u) => u.severity === "important").length,
      optional: updates.filter((u) => u.severity === "optional").length,
    };
  }, [updates]);

  const groupedByDevice = useMemo(() => {
    if (!updates) return new Map<string, Update[]>();
    const grouped = new Map<string, Update[]>();
    updates.forEach((update) => {
      const existing = grouped.get(update.deviceId) || [];
      grouped.set(update.deviceId, [...existing, update]);
    });
    return grouped;
  }, [updates]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-slate-400">Total Updates</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-sm text-slate-400">Critical</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-400">{stats.critical}</p>
        </div>
        <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-sm text-slate-400">Important</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-400">{stats.important}</p>
        </div>
        <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-slate-500" />
            <span className="text-sm text-slate-400">Optional</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-400">{stats.optional}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search updates..."
              value={filter.search}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, search: e.target.value }))
              }
              className="w-[250px] border-slate-800 bg-slate-900/50 pl-9 text-white placeholder:text-slate-500 focus:border-cyan-500/50"
            />
          </div>
          <Select
            value={filter.severity || "all"}
            onValueChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                severity: value as UpdatesFilter["severity"],
              }))
            }
          >
            <SelectTrigger className="w-[150px] border-slate-800 bg-slate-900/50 text-white">
              <Filter className="mr-2 h-4 w-4 text-slate-500" />
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent className="border-slate-800 bg-slate-900">
              <SelectItem value="all" className="text-slate-300 focus:bg-slate-800 focus:text-white">
                All Severity
              </SelectItem>
              <SelectItem value="critical" className="text-slate-300 focus:bg-slate-800 focus:text-white">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  Critical
                </div>
              </SelectItem>
              <SelectItem value="important" className="text-slate-300 focus:bg-slate-800 focus:text-white">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  Important
                </div>
              </SelectItem>
              <SelectItem value="optional" className="text-slate-300 focus:bg-slate-800 focus:text-white">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-slate-500" />
                  Optional
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filter.deviceId || "all"}
            onValueChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                deviceId: value === "all" ? undefined : value,
              }))
            }
          >
            <SelectTrigger className="w-[200px] border-slate-800 bg-slate-900/50 text-white">
              <Monitor className="mr-2 h-4 w-4 text-slate-500" />
              <SelectValue placeholder="Device" />
            </SelectTrigger>
            <SelectContent className="border-slate-800 bg-slate-900">
              <SelectItem value="all" className="text-slate-300 focus:bg-slate-800 focus:text-white">
                All Devices
              </SelectItem>
              {devices?.filter(d => d.pendingUpdates > 0).map((device) => (
                <SelectItem
                  key={device.id}
                  value={device.id}
                  className="text-slate-300 focus:bg-slate-800 focus:text-white"
                >
                  {device.hostname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            className="bg-cyan-600 text-white hover:bg-cyan-700"
            disabled={stats.total === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Install All ({stats.total})
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800/50 bg-slate-900/50">
        {updatesLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : updates && updates.length > 0 ? (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/50 hover:bg-transparent">
                  <TableHead className="text-slate-400">Package</TableHead>
                  <TableHead className="text-slate-400">Device</TableHead>
                  <TableHead className="text-slate-400">Current</TableHead>
                  <TableHead className="text-slate-400">Available</TableHead>
                  <TableHead className="text-slate-400">Severity</TableHead>
                  <TableHead className="text-slate-400">Size</TableHead>
                  <TableHead className="text-slate-400">Published</TableHead>
                  <TableHead className="text-slate-400">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {updates.map((update) => {
                  const severity = severityConfig[update.severity];
                  const SeverityIcon = severity.icon;
                  return (
                    <TableRow
                      key={update.id}
                      className="border-slate-800/50 hover:bg-slate-800/30"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">
                            {update.packageName}
                          </p>
                          <p className="max-w-[250px] truncate text-xs text-slate-500">
                            {update.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/devices/${update.deviceId}`}
                          className="flex items-center gap-2 text-slate-300 hover:text-cyan-400"
                        >
                          <Monitor className="h-4 w-4" />
                          {update.deviceHostname}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-500">
                        {update.currentVersion}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-white">
                        {update.availableVersion}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={severity.className}>
                          <SeverityIcon className="mr-1 h-3 w-3" />
                          {severity.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {update.size}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="text-sm">
                            {formatDate(update.publishedAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                          Install
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="flex h-[300px] flex-col items-center justify-center gap-2">
            <CheckCircle2 className="h-16 w-16 text-emerald-500/30" />
            <p className="text-lg font-medium text-white">All Up to Date</p>
            <p className="text-slate-500">No pending updates found</p>
          </div>
        )}
      </div>

      {/* Grouped by Device Summary */}
      {groupedByDevice.size > 0 && (
        <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Updates by Device
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from(groupedByDevice.entries()).map(([deviceId, deviceUpdates]) => {
              const criticalCount = deviceUpdates.filter(
                (u) => u.severity === "critical"
              ).length;
              return (
                <Link
                  key={deviceId}
                  href={`/devices/${deviceId}`}
                  className="flex items-center justify-between rounded-lg border border-slate-800/50 bg-slate-800/30 p-4 transition-colors hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                      <Monitor className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {deviceUpdates[0].deviceHostname}
                      </p>
                      <p className="text-sm text-slate-500">
                        {deviceUpdates.length} update
                        {deviceUpdates.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {criticalCount > 0 && (
                      <Badge
                        variant="outline"
                        className="border-rose-500/30 bg-rose-500/10 text-rose-400"
                      >
                        {criticalCount} critical
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

