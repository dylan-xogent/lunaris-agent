import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { EventsService } from '../events/events.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { DeviceStatus, UpdateSource, UpdateSeverity, ActivityEventType } from '@prisma/client';

@Injectable()
export class AgentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Register a new device
   */
  async registerDevice(dto: RegisterDeviceDto) {
    // Check if device with same MAC address already exists
    const existingDevice = await this.prisma.device.findUnique({
      where: { macAddress: dto.macAddress },
    });

    if (existingDevice) {
      // Update existing device and return it
      const updatedDevice = await this.prisma.device.update({
        where: { id: existingDevice.id },
        data: {
          hostname: dto.hostname,
          os: dto.os,
          osVersion: dto.osVersion,
          agentVersion: dto.agentVersion,
          status: DeviceStatus.online,
          lastSeenAt: new Date(),
        },
      });

      // Broadcast device status change
      this.realtime.broadcastDeviceStatusChange(
        updatedDevice.id,
        DeviceStatus.online,
        updatedDevice.lastSeenAt!,
      );

      return {
        deviceId: updatedDevice.id,
        message: 'Device re-registered successfully',
      };
    }

    // Create new device
    const device = await this.prisma.device.create({
      data: {
        hostname: dto.hostname,
        os: dto.os,
        osVersion: dto.osVersion,
        macAddress: dto.macAddress,
        agentVersion: dto.agentVersion,
        status: DeviceStatus.online,
        lastSeenAt: new Date(),
      },
    });

    // Broadcast new device registration
    this.realtime.broadcastDeviceRegistered(device);

    // Create activity event
    await this.eventsService.createEvent({
      type: ActivityEventType.device_enrolled,
      deviceId: device.id,
      deviceName: device.hostname,
      title: `Device "${device.hostname}" enrolled`,
      description: `New device with MAC ${device.macAddress} running ${device.os} ${device.osVersion}`,
      metadata: {
        os: device.os,
        osVersion: device.osVersion,
        agentVersion: device.agentVersion,
      },
    });

    return {
      deviceId: device.id,
      message: 'Device registered successfully',
    };
  }

  /**
   * Process heartbeat from agent
   */
  async processHeartbeat(dto: HeartbeatDto) {
    const device = await this.prisma.device.findUnique({
      where: { id: dto.deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device ${dto.deviceId} not found`);
    }

    const wasOffline = device.status === DeviceStatus.offline;
    const now = new Date();

    // Update device status and last seen
    await this.prisma.device.update({
      where: { id: dto.deviceId },
      data: {
        status: DeviceStatus.online,
        lastSeenAt: now,
        ipAddress: dto.ipAddress,
      },
    });

    // Update metrics if provided
    if (dto.cpuUsage !== undefined || dto.memoryUsage !== undefined || dto.diskUsage !== undefined) {
      await this.prisma.deviceMetrics.upsert({
        where: { deviceId: dto.deviceId },
        create: {
          deviceId: dto.deviceId,
          cpuUsage: dto.cpuUsage,
          memoryUsage: dto.memoryUsage,
          diskUsage: dto.diskUsage,
        },
        update: {
          cpuUsage: dto.cpuUsage,
          memoryUsage: dto.memoryUsage,
          diskUsage: dto.diskUsage,
        },
      });

      // Store metrics in history for charts (every heartbeat = every 30 seconds)
      await this.prisma.deviceMetricsHistory.create({
        data: {
          deviceId: dto.deviceId,
          cpuUsage: dto.cpuUsage,
          memoryUsage: dto.memoryUsage,
          diskUsage: dto.diskUsage,
          timestamp: now,
        },
      });
    }

    // Create activity event if device came back online
    if (wasOffline) {
      await this.eventsService.createEvent({
        type: ActivityEventType.device_online,
        deviceId: dto.deviceId,
        deviceName: device.hostname,
        title: `Device "${device.hostname}" came online`,
        description: `Device reconnected after being offline`,
        metadata: {
          ipAddress: dto.ipAddress,
        },
      });
    }

    // Always broadcast heartbeat to update last seen time in realtime
    this.realtime.broadcastDeviceStatusChange(
      dto.deviceId,
      DeviceStatus.online,
      now,
    );

    return {
      status: 'ok',
      serverTime: new Date().toISOString(),
    };
  }

  /**
   * Process update report from agent
   */
  async processUpdateReport(dto: UpdateReportDto) {
    const device = await this.prisma.device.findUnique({
      where: { id: dto.deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device ${dto.deviceId} not found`);
    }

    // Get current updates for comparison
    const currentUpdates = await this.prisma.deviceUpdate.findMany({
      where: { deviceId: dto.deviceId },
    });

    const currentUpdateIds = new Set(currentUpdates.map((u) => u.packageIdentifier));
    const reportedUpdateIds = new Set(dto.updates.map((u) => u.packageIdentifier));

    // Delete updates that are no longer reported (they were installed)
    const toDelete = currentUpdates.filter(
      (u) => !reportedUpdateIds.has(u.packageIdentifier),
    );

    if (toDelete.length > 0) {
      await this.prisma.deviceUpdate.deleteMany({
        where: {
          id: { in: toDelete.map((u) => u.id) },
        },
      });

      // Log installed events
      for (const update of toDelete) {
        await this.prisma.updateEvent.create({
          data: {
            deviceId: dto.deviceId,
            action: 'installed',
            packageIdentifier: update.packageIdentifier,
            version: update.availableVersion,
            status: 'completed',
            message: 'Update installed (no longer reported)',
          },
        });
      }
    }

    // Upsert reported updates
    for (const update of dto.updates) {
      const severity = this.determineSeverity(update.packageName);

      await this.prisma.deviceUpdate.upsert({
        where: {
          deviceId_packageIdentifier: {
            deviceId: dto.deviceId,
            packageIdentifier: update.packageIdentifier,
          },
        },
        create: {
          deviceId: dto.deviceId,
          packageIdentifier: update.packageIdentifier,
          packageName: update.packageName,
          installedVersion: update.installedVersion,
          availableVersion: update.availableVersion,
          source: update.source as UpdateSource,
          severity,
        },
        update: {
          packageName: update.packageName,
          installedVersion: update.installedVersion,
          availableVersion: update.availableVersion,
          source: update.source as UpdateSource,
        },
      });

      // Log detection event for new updates
      if (!currentUpdateIds.has(update.packageIdentifier)) {
        await this.prisma.updateEvent.create({
          data: {
            deviceId: dto.deviceId,
            action: 'detected',
            packageIdentifier: update.packageIdentifier,
            version: update.availableVersion,
            status: 'completed',
          },
        });
      }
    }

    // Count updates and broadcast change
    const updateCount = await this.prisma.deviceUpdate.count({
      where: { deviceId: dto.deviceId },
    });

    const criticalCount = await this.prisma.deviceUpdate.count({
      where: {
        deviceId: dto.deviceId,
        severity: UpdateSeverity.critical,
      },
    });

    this.realtime.broadcastDeviceUpdatesChanged(
      dto.deviceId,
      updateCount,
      criticalCount,
    );

    return {
      received: dto.updates.length,
      message: 'Update report processed successfully',
    };
  }

  /**
   * Get pending commands for a device
   */
  async getPendingCommands(deviceId: string) {
    const commands = await this.prisma.command.findMany({
      where: {
        deviceId,
        status: 'pending',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Mark commands as executing
    if (commands.length > 0) {
      await this.prisma.command.updateMany({
        where: {
          id: { in: commands.map(c => c.id) },
        },
        data: {
          status: 'executing',
          executedAt: new Date(),
        },
      });
    }

    return {
      commands: commands.map(cmd => ({
        id: cmd.id,
        type: cmd.type,
        packageIdentifiers: cmd.packageIdentifiers,
        createdAt: cmd.createdAt,
      })),
    };
  }

  /**
   * Mark a command as completed
   */
  async completeCommand(commandId: string, dto: { success: boolean; result?: string }) {
    const command = await this.prisma.command.findUnique({
      where: { id: commandId },
    });

    if (!command) {
      throw new NotFoundException(`Command ${commandId} not found`);
    }

    await this.prisma.command.update({
      where: { id: commandId },
      data: {
        status: dto.success ? 'completed' : 'failed',
        result: dto.result,
        completedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Command marked as completed',
    };
  }

  /**
   * Determine severity based on package name
   * This is a simple heuristic - could be enhanced with a database of known packages
   */
  private determineSeverity(packageName: string): UpdateSeverity {
    const name = packageName.toLowerCase();

    // Critical updates
    if (
      name.includes('security') ||
      name.includes('defender') ||
      name.includes('antivirus') ||
      name.includes('critical')
    ) {
      return UpdateSeverity.critical;
    }

    // Important updates
    if (
      name.includes('framework') ||
      name.includes('runtime') ||
      name.includes('driver') ||
      name.includes('office')
    ) {
      return UpdateSeverity.important;
    }

    // Default to optional
    return UpdateSeverity.optional;
  }
}

