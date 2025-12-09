"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDevice, getDeviceUpdates, installUpdates } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { DeviceStatusBadge } from "@/components/devices/device-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Globe,
  Clock,
  Calendar,
  Package,
  Download,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLastSeen(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    className: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  },
  important: {
    icon: Info,
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  optional: {
    icon: CheckCircle2,
    className: "border-slate-500/30 bg-slate-500/10 text-slate-400",
  },
};

export default function DeviceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const { data: device, isLoading: deviceLoading } = useQuery({
    queryKey: ["device", id],
    queryFn: () => getDevice(id),
  });

  const { data: updates, isLoading: updatesLoading } = useQuery({
    queryKey: ["device-updates", id],
    queryFn: () => getDeviceUpdates(id),
  });

  const installMutation = useMutation({
    mutationFn: (packageIdentifiers: string[]) =>
      installUpdates(id, packageIdentifiers),
    onSuccess: (data) => {
      console.log("Installation triggered:", data);
      // Refetch device updates to reflect the installation status
      queryClient.invalidateQueries({ queryKey: ["device-updates", id] });
      queryClient.invalidateQueries({ queryKey: ["device", id] });
    },
    onError: (error) => {
      console.error("Failed to trigger installation:", error);
      alert("Failed to trigger installation: " + (error as Error).message);
    },
  });

  const handleInstallUpdate = (packageIdentifier: string) => {
    if (
      confirm(
        `Are you sure you want to install this update?\n\nPackage: ${packageIdentifier}`
      )
    ) {
      installMutation.mutate([packageIdentifier]);
    }
  };

  const handleInstallAll = () => {
    if (!updates || updates.length === 0) return;

    const packageIds = updates.map((u) => u.packageIdentifier);
    if (
      confirm(
        `Are you sure you want to install ${updates.length} update(s)?\n\nThis will install all available updates on ${device?.hostname}.`
      )
    ) {
      installMutation.mutate(packageIds);
    }
  };

  if (deviceLoading) {
    return (
      <>
        <Header title="Device Details" />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      </>
    );
  }

  if (!device) {
    return (
      <>
        <Header title="Device Details" />
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
          <Monitor className="h-16 w-16 text-slate-600" />
          <h2 className="text-xl font-semibold text-white">Device Not Found</h2>
          <p className="text-slate-400">The requested device could not be found.</p>
          <Button asChild variant="outline" className="mt-4 border-slate-700 text-slate-300">
            <Link href="/devices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Devices
            </Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Device Details" />
      <div className="p-6">
        {/* Back Button */}
        <Button
          asChild
          variant="ghost"
          className="mb-6 text-slate-400 hover:text-white"
        >
          <Link href="/devices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Devices
          </Link>
        </Button>

        {/* Device Header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30">
              <Monitor className="h-8 w-8 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{device.hostname}</h1>
                <DeviceStatusBadge status={device.status} size="lg" />
              </div>
              <p className="mt-1 font-mono text-sm text-slate-500">
                {device.macAddress} • {device.ipAddress || "No IP"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync
            </Button>
            {device.pendingUpdates > 0 && (
              <Button
                className="bg-cyan-600 text-white hover:bg-cyan-700"
                onClick={handleInstallAll}
                disabled={installMutation.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                {installMutation.isPending ? "Installing..." : "Install All Updates"}
              </Button>
            )}
          </div>
        </div>

        {/* System Info Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-800/50 bg-slate-900/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-cyan-500/10 p-2.5">
                <Globe className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Operating System</p>
                <p className="font-medium text-white">{device.os}</p>
                <p className="text-xs text-slate-400">{device.osVersion}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800/50 bg-slate-900/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-emerald-500/10 p-2.5">
                <Package className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Agent Version</p>
                <p className="font-medium text-white">v{device.agentVersion}</p>
                <p className="text-xs text-slate-400">Up to date</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800/50 bg-slate-900/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-amber-500/10 p-2.5">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Last Seen</p>
                <p className="font-medium text-white">
                  {device.lastSeenAt ? formatLastSeen(device.lastSeenAt) : "Never"}
                </p>
                <p className="text-xs text-slate-400">
                  {device.lastSeenAt ? formatDate(device.lastSeenAt) : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800/50 bg-slate-900/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-violet-500/10 p-2.5">
                <Calendar className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Enrolled</p>
                <p className="font-medium text-white">
                  {formatDate(device.enrolledAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Metrics */}
        {device.status === "online" && device.cpuUsage != null && (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border-slate-800/50 bg-slate-900/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-400">CPU Usage</span>
                  </div>
                  <span className="text-lg font-semibold text-white">
                    {device.cpuUsage ?? 0}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      (device.cpuUsage ?? 0) > 80
                        ? "bg-rose-500"
                        : (device.cpuUsage ?? 0) > 60
                        ? "bg-amber-500"
                        : "bg-cyan-500"
                    )}
                    style={{ width: `${device.cpuUsage ?? 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800/50 bg-slate-900/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MemoryStick className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-400">Memory Usage</span>
                  </div>
                  <span className="text-lg font-semibold text-white">
                    {device.memoryUsage ?? 0}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      (device.memoryUsage ?? 0) > 80
                        ? "bg-rose-500"
                        : (device.memoryUsage ?? 0) > 60
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    )}
                    style={{ width: `${device.memoryUsage ?? 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800/50 bg-slate-900/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-400">Disk Usage</span>
                  </div>
                  <span className="text-lg font-semibold text-white">
                    {device.diskUsage ?? 0}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      (device.diskUsage ?? 0) > 80
                        ? "bg-rose-500"
                        : (device.diskUsage ?? 0) > 60
                        ? "bg-amber-500"
                        : "bg-violet-500"
                    )}
                    style={{ width: `${device.diskUsage ?? 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Available Updates */}
        <Card className="border-slate-800/50 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Download className="h-5 w-5 text-cyan-400" />
              Available Updates ({updates?.length ?? 0})
            </CardTitle>
            {updates && updates.length > 0 && (
              <Button
                size="sm"
                className="bg-cyan-600 text-white hover:bg-cyan-700"
                onClick={handleInstallAll}
                disabled={installMutation.isPending}
              >
                {installMutation.isPending ? "Installing..." : "Install All"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {updatesLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
              </div>
            ) : updates && updates.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800/50 hover:bg-transparent">
                      <TableHead className="text-slate-400">Package</TableHead>
                      <TableHead className="text-slate-400">Current</TableHead>
                      <TableHead className="text-slate-400">Available</TableHead>
                      <TableHead className="text-slate-400">Severity</TableHead>
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
                              {update.description && (
                                <p className="text-xs text-slate-500">
                                  {update.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-slate-500">
                            {update.currentVersion || update.installedVersion || "—"}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-white">
                            {update.availableVersion}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={severity.className}
                            >
                              <SeverityIcon className="mr-1 h-3 w-3" />
                              {update.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-700 text-slate-300 hover:bg-slate-800"
                              onClick={() => handleInstallUpdate(update.packageIdentifier)}
                              disabled={installMutation.isPending}
                            >
                              {installMutation.isPending ? "..." : "Install"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center gap-2">
                <CheckCircle2 className="h-12 w-12 text-emerald-500/50" />
                <p className="text-slate-400">No updates available</p>
                <p className="text-sm text-slate-500">This device is up to date</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
