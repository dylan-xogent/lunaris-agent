import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceStatus, UpdateSeverity } from '@prisma/client';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [
      totalDevices,
      onlineDevices,
      offlineDevices,
      devicesWithUpdates,
      totalPendingUpdates,
      criticalUpdates,
      allMetrics,
    ] = await Promise.all([
      this.prisma.device.count(),
      this.prisma.device.count({ where: { status: DeviceStatus.online } }),
      this.prisma.device.count({ where: { status: DeviceStatus.offline } }),
      this.prisma.device.count({
        where: {
          updates: { some: {} },
        },
      }),
      this.prisma.deviceUpdate.count(),
      this.prisma.deviceUpdate.count({
        where: { severity: UpdateSeverity.critical },
      }),
      this.prisma.deviceMetrics.findMany({
        where: {
          device: {
            status: DeviceStatus.online,
          },
        },
      }),
    ]);

    const onlinePercentage =
      totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;

    // Calculate average metrics from online devices
    const avgCpuUsage = allMetrics.length > 0
      ? Math.round(allMetrics.reduce((sum, m) => sum + (m.cpuUsage || 0), 0) / allMetrics.length)
      : 0;

    const avgMemoryUsage = allMetrics.length > 0
      ? Math.round(allMetrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0) / allMetrics.length)
      : 0;

    const avgDiskUsage = allMetrics.length > 0
      ? Math.round(allMetrics.reduce((sum, m) => sum + (m.diskUsage || 0), 0) / allMetrics.length * 10) / 10
      : 0;

    // Calculate health score (0-100)
    // Based on: online percentage (40%), low CPU (20%), low Memory (20%), low Disk (10%), no critical updates (10%)
    const cpuScore = Math.max(0, 100 - avgCpuUsage);
    const memoryScore = Math.max(0, 100 - avgMemoryUsage);
    const diskScore = Math.max(0, 100 - avgDiskUsage);
    const updatesScore = criticalUpdates === 0 ? 100 : Math.max(0, 100 - (criticalUpdates * 10));

    const healthScore = Math.round(
      onlinePercentage * 0.4 +
      cpuScore * 0.2 +
      memoryScore * 0.2 +
      diskScore * 0.1 +
      updatesScore * 0.1
    );

    return {
      totalDevices,
      onlineDevices,
      offlineDevices,
      devicesWithUpdates,
      totalPendingUpdates,
      criticalUpdates,
      onlinePercentage,
      avgCpuUsage,
      avgMemoryUsage,
      avgDiskUsage,
      healthScore,
      uptime: onlinePercentage, // Fleet uptime = online percentage
    };
  }
}

