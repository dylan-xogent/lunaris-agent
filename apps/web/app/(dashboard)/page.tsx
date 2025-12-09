"use client";

import { useQuery } from "@tanstack/react-query";
import { getStats } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { DevicesTable } from "@/components/dashboard/devices-table";
import {
  Monitor,
  Wifi,
  AlertTriangle,
  Download,
} from "lucide-react";

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
    refetchInterval: 30000,
  });

  return (
    <>
      <Header title="Dashboard" />
      <div className="p-6">
        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Devices"
            value={isLoading ? "—" : stats?.totalDevices ?? 0}
            subtitle="Enrolled machines"
            icon={Monitor}
            variant="info"
          />
          <StatCard
            title="Online Devices"
            value={isLoading ? "—" : stats?.onlineDevices ?? 0}
            subtitle={
              isLoading
                ? "—"
                : `${stats?.onlinePercentage ?? 0}% availability`
            }
            icon={Wifi}
            variant="success"
          />
          <StatCard
            title="Devices with Updates"
            value={isLoading ? "—" : stats?.devicesWithUpdates ?? 0}
            subtitle="Require attention"
            icon={AlertTriangle}
            variant="warning"
          />
          <StatCard
            title="Pending Updates"
            value={isLoading ? "—" : stats?.totalPendingUpdates ?? 0}
            subtitle={
              isLoading
                ? "—"
                : `${stats?.criticalUpdates ?? 0} critical`
            }
            icon={Download}
            variant={
              stats?.criticalUpdates && stats.criticalUpdates > 0
                ? "danger"
                : "default"
            }
          />
        </div>

        {/* Devices Table */}
        <DevicesTable />
      </div>
    </>
  );
}

