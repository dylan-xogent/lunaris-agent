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
    ]);

    const onlinePercentage =
      totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;

    return {
      totalDevices,
      onlineDevices,
      offlineDevices,
      devicesWithUpdates,
      totalPendingUpdates,
      criticalUpdates,
      onlinePercentage,
    };
  }
}

