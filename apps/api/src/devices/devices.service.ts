import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { EventsService } from '../events/events.service';
import { DeviceStatus, ActivityEventType } from '@prisma/client';
import { InstallUpdateDto } from './dto/install-update.dto';
import { BulkAddToGroupDto } from './dto/bulk-add-to-group.dto';
import { BulkAddTagsDto } from './dto/bulk-add-tags.dto';
import { BulkInstallUpdatesDto } from './dto/bulk-install-updates.dto';
import { randomUUID } from 'crypto';

interface FindAllOptions {
  status?: string;
  search?: string;
}

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Get all devices with filtering
   */
  async findAll(options: FindAllOptions = {}) {
    const where: any = {};

    // Filter by status
    if (options.status && options.status !== 'all') {
      where.status = options.status as DeviceStatus;
    }

    // Search by hostname, IP, or OS
    if (options.search) {
      where.OR = [
        { hostname: { contains: options.search, mode: 'insensitive' } },
        { ipAddress: { contains: options.search } },
        { os: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const devices = await this.prisma.device.findMany({
      where,
      include: {
        _count: {
          select: { updates: true },
        },
        metrics: true,
        groups: {
          include: {
            group: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { hostname: 'asc' },
    });

    // Transform to include pendingUpdates count and groups/tags
    return devices.map((device) => ({
      id: device.id,
      hostname: device.hostname,
      os: device.os,
      osVersion: device.osVersion,
      ipAddress: device.ipAddress,
      macAddress: device.macAddress,
      agentVersion: device.agentVersion,
      status: device.status,
      lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
      enrolledAt: device.enrolledAt.toISOString(),
      pendingUpdates: device._count.updates,
      cpuUsage: device.metrics?.cpuUsage ?? null,
      memoryUsage: device.metrics?.memoryUsage ?? null,
      diskUsage: device.metrics?.diskUsage ?? null,
      groups: device.groups.map((membership) => ({
        id: membership.group.id,
        name: membership.group.name,
        color: membership.group.color,
      })),
      tags: device.tags.map((membership) => ({
        id: membership.tag.id,
        name: membership.tag.name,
        color: membership.tag.color,
      })),
    }));
  }

  /**
   * Get a single device with all details
   */
  async findOne(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: {
        updates: {
          orderBy: [{ severity: 'asc' }, { packageName: 'asc' }],
        },
        metrics: true,
        groups: {
          include: {
            group: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!device) {
      throw new NotFoundException(`Device ${id} not found`);
    }

    return {
      id: device.id,
      hostname: device.hostname,
      os: device.os,
      osVersion: device.osVersion,
      ipAddress: device.ipAddress,
      macAddress: device.macAddress,
      agentVersion: device.agentVersion,
      status: device.status,
      lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
      enrolledAt: device.enrolledAt.toISOString(),
      pendingUpdates: device.updates.length,
      cpuUsage: device.metrics?.cpuUsage ?? null,
      memoryUsage: device.metrics?.memoryUsage ?? null,
      diskUsage: device.metrics?.diskUsage ?? null,
      groups: device.groups.map((membership) => ({
        id: membership.group.id,
        name: membership.group.name,
        description: membership.group.description,
        color: membership.group.color,
        addedAt: membership.addedAt.toISOString(),
      })),
      tags: device.tags.map((membership) => ({
        id: membership.tag.id,
        name: membership.tag.name,
        color: membership.tag.color,
        addedAt: membership.addedAt.toISOString(),
      })),
      updates: device.updates.map((u) => ({
        id: u.id,
        packageIdentifier: u.packageIdentifier,
        packageName: u.packageName,
        installedVersion: u.installedVersion,
        availableVersion: u.availableVersion,
        source: u.source,
        severity: u.severity,
        size: u.size,
        description: u.description,
        publishedAt: u.publishedAt?.toISOString() ?? null,
      })),
    };
  }

  /**
   * Get active commands for a device (pending, executing, or recently completed)
   */
  async getDeviceCommands(deviceId: string) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const commands = await this.prisma.command.findMany({
      where: {
        deviceId,
        OR: [
          { status: { in: ['pending', 'executing'] } },
          {
            status: { in: ['completed', 'failed'] },
            completedAt: { gte: fiveMinutesAgo }, // Show completed/failed from last 5 minutes
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit to recent 10 commands
    });

    return commands.map((cmd) => ({
      id: cmd.id,
      type: cmd.type,
      status: cmd.status,
      packageIdentifiers: cmd.packageIdentifiers,
      result: cmd.result,
      createdAt: cmd.createdAt,
      executedAt: cmd.executedAt,
      completedAt: cmd.completedAt,
    }));
  }

  /**
   * Get updates for a specific device
   */
  async getDeviceUpdates(deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    const updates = await this.prisma.deviceUpdate.findMany({
      where: { deviceId },
      orderBy: [{ severity: 'asc' }, { packageName: 'asc' }],
    });

    return updates.map((u) => ({
      id: u.id,
      deviceId: u.deviceId,
      deviceHostname: device.hostname,
      packageIdentifier: u.packageIdentifier,
      packageName: u.packageName,
      installedVersion: u.installedVersion,
      availableVersion: u.availableVersion,
      source: u.source,
      severity: u.severity,
      size: u.size,
      description: u.description,
      publishedAt: u.publishedAt?.toISOString() ?? null,
    }));
  }

  /**
   * Get historical metrics for a device
   */
  async getDeviceMetrics(deviceId: string, range: string = '24h') {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    // Calculate time range
    const now = new Date();
    const rangeMinutes = {
      '1h': 60,
      '24h': 60 * 24,
      '7d': 60 * 24 * 7,
      '30d': 60 * 24 * 30,
    }[range] || 60 * 24;

    const startTime = new Date(now.getTime() - rangeMinutes * 60 * 1000);

    // Fetch historical metrics
    const metrics = await this.prisma.deviceMetricsHistory.findMany({
      where: {
        deviceId,
        timestamp: {
          gte: startTime,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    return {
      deviceId,
      hostname: device.hostname,
      range,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      dataPoints: metrics.length,
      metrics: metrics.map((m) => ({
        timestamp: m.timestamp.toISOString(),
        cpu: m.cpuUsage,
        memory: m.memoryUsage,
        disk: m.diskUsage,
      })),
    };
  }

  /**
   * Mark devices as offline if they haven't sent heartbeat recently
   */
  async markStaleDevicesOffline(staleThresholdMinutes: number = 1.5) {
    const threshold = new Date();
    threshold.setMinutes(threshold.getMinutes() - staleThresholdMinutes);

    const staleDevices = await this.prisma.device.findMany({
      where: {
        status: DeviceStatus.online,
        lastSeenAt: { lt: threshold },
      },
    });

    if (staleDevices.length > 0) {
      // Update each device individually so we can broadcast the status change
      for (const device of staleDevices) {
        await this.prisma.device.update({
          where: { id: device.id },
          data: { status: DeviceStatus.offline },
        });

        // Broadcast offline status change to WebSocket clients
        this.realtime.broadcastDeviceStatusChange(
          device.id,
          DeviceStatus.offline,
          device.lastSeenAt || new Date(),
        );

        // Create activity event for device going offline
        await this.eventsService.createEvent({
          type: ActivityEventType.device_offline,
          deviceId: device.id,
          deviceName: device.hostname,
          title: `Device "${device.hostname}" went offline`,
          description: `Device missed ${Math.ceil(staleThresholdMinutes * 2)} heartbeats`,
          metadata: {
            lastSeenAt: device.lastSeenAt?.toISOString(),
            thresholdMinutes: staleThresholdMinutes,
          },
        });
      }
    }

    return {
      markedOffline: staleDevices.length,
      devices: staleDevices.map((d) => d.id),
    };
  }

  /**
   * Trigger update installation on a device
   */
  async installUpdates(deviceId: string, dto: InstallUpdateDto) {
    // Verify device exists and is online
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    if (device.status !== DeviceStatus.online) {
      throw new NotFoundException(
        `Device ${deviceId} is offline and cannot receive commands`,
      );
    }

    // Verify the updates exist for this device
    const updates = await this.prisma.deviceUpdate.findMany({
      where: {
        deviceId,
        packageIdentifier: { in: dto.packageIdentifiers },
      },
    });

    if (updates.length === 0) {
      throw new NotFoundException(
        `No updates found for device ${deviceId} with the specified package identifiers`,
      );
    }

    // Create command in database for agent to poll
    const command = await this.prisma.command.create({
      data: {
        deviceId,
        type: 'install_updates',
        packageIdentifiers: dto.packageIdentifiers,
        status: 'pending',
      },
    });

    // Create update events for tracking
    for (const update of updates) {
      await this.prisma.updateEvent.create({
        data: {
          deviceId,
          action: 'install_triggered',
          packageIdentifier: update.packageIdentifier,
          version: update.availableVersion,
          status: 'pending',
          message: `Installation queued (command: ${command.id})`,
        },
      });
    }

    // Broadcast to console that installation has been queued
    this.realtime.broadcastUpdateInstallationStarted(
      deviceId,
      dto.packageIdentifiers,
      command.id,
    );

    return {
      success: true,
      commandId: command.id,
      deviceId,
      packagesQueued: updates.length,
      message: `Installation command queued for device ${device.hostname}`,
    };
  }

  /**
   * Trigger a forced sync (update scan) on a device
   */
  async syncDevice(deviceId: string) {
    // Verify device exists and is online
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    if (device.status !== DeviceStatus.online) {
      throw new NotFoundException(
        `Device ${deviceId} is offline and cannot receive commands`,
      );
    }

    // Create sync command in database for agent to poll
    const command = await this.prisma.command.create({
      data: {
        deviceId,
        type: 'run_scan',
        packageIdentifiers: [], // No packages needed for sync
        status: 'pending',
      },
    });

    // Create activity event for tracking
    await this.prisma.activityEvent.create({
      data: {
        type: 'command_executed',
        deviceId,
        deviceName: device.hostname,
        title: 'Sync Triggered',
        description: `Update scan sync command queued (command: ${command.id})`,
        metadata: {
          commandId: command.id,
          commandType: 'run_scan',
          action: 'sync',
        },
      },
    });

    // Broadcast to console that sync has been triggered
    this.realtime.broadcastUpdateInstallationStarted(
      deviceId,
      [],
      command.id,
    );

    return {
      success: true,
      commandId: command.id,
      deviceId,
      message: `Sync command queued for device ${device.hostname}`,
    };
  }

  /**
   * Bulk add devices to a group
   */
  async bulkAddToGroup(dto: BulkAddToGroupDto) {
    // Verify group exists
    const group = await this.prisma.group.findUnique({
      where: { id: dto.groupId },
    });

    if (!group) {
      throw new NotFoundException(`Group ${dto.groupId} not found`);
    }

    // Verify all devices exist and are online
    const devices = await this.prisma.device.findMany({
      where: { id: { in: dto.deviceIds } },
    });

    if (devices.length !== dto.deviceIds.length) {
      throw new NotFoundException('One or more device IDs are invalid');
    }

    // Add devices to group (skip duplicates)
    const memberships = await Promise.all(
      dto.deviceIds.map((deviceId) =>
        this.prisma.deviceGroupMembership.upsert({
          where: {
            deviceId_groupId: {
              deviceId,
              groupId: dto.groupId,
            },
          },
          create: {
            deviceId,
            groupId: dto.groupId,
          },
          update: {},
        }),
      ),
    );

    return {
      success: true,
      groupId: dto.groupId,
      groupName: group.name,
      devicesAdded: memberships.length,
      message: `Added ${memberships.length} device(s) to group "${group.name}"`,
    };
  }

  /**
   * Bulk add tags to devices
   */
  async bulkAddTags(dto: BulkAddTagsDto) {
    // Verify all tags exist
    const tags = await this.prisma.tag.findMany({
      where: { id: { in: dto.tagIds } },
    });

    if (tags.length !== dto.tagIds.length) {
      throw new NotFoundException('One or more tag IDs are invalid');
    }

    // Verify all devices exist
    const devices = await this.prisma.device.findMany({
      where: { id: { in: dto.deviceIds } },
    });

    if (devices.length !== dto.deviceIds.length) {
      throw new NotFoundException('One or more device IDs are invalid');
    }

    // Add tags to all devices
    let addedCount = 0;
    for (const deviceId of dto.deviceIds) {
      for (const tagId of dto.tagIds) {
        await this.prisma.deviceTag.upsert({
          where: {
            deviceId_tagId: {
              deviceId,
              tagId,
            },
          },
          create: {
            deviceId,
            tagId,
          },
          update: {},
        });
        addedCount++;
      }
    }

    return {
      success: true,
      devicesAffected: dto.deviceIds.length,
      tagsApplied: dto.tagIds.length,
      totalAssignments: addedCount,
      message: `Applied ${dto.tagIds.length} tag(s) to ${dto.deviceIds.length} device(s)`,
    };
  }

  /**
   * Bulk install updates on multiple devices
   */
  async bulkInstallUpdates(dto: BulkInstallUpdatesDto) {
    // Verify all devices exist and are online
    const devices = await this.prisma.device.findMany({
      where: { id: { in: dto.deviceIds } },
    });

    if (devices.length !== dto.deviceIds.length) {
      throw new NotFoundException('One or more device IDs are invalid');
    }

    const offlineDevices = devices.filter((d) => d.status !== DeviceStatus.online);
    if (offlineDevices.length > 0) {
      throw new BadRequestException(
        `${offlineDevices.length} device(s) are offline and cannot receive commands`,
      );
    }

    const results = [];

    // Create commands for each device
    for (const device of devices) {
      const command = await this.prisma.command.create({
        data: {
          deviceId: device.id,
          type: 'install_updates',
          packageIdentifiers: dto.packageIdentifiers,
          status: 'pending',
        },
      });

      // Create update events
      for (const packageIdentifier of dto.packageIdentifiers) {
        await this.prisma.updateEvent.create({
          data: {
            deviceId: device.id,
            action: 'install_triggered',
            packageIdentifier,
            status: 'pending',
            message: `Installation queued (command: ${command.id})`,
          },
        });
      }

      // Broadcast to console
      this.realtime.broadcastUpdateInstallationStarted(
        device.id,
        dto.packageIdentifiers,
        command.id,
      );

      results.push({
        deviceId: device.id,
        hostname: device.hostname,
        commandId: command.id,
      });
    }

    return {
      success: true,
      devicesQueued: results.length,
      packagesPerDevice: dto.packageIdentifiers.length,
      results,
      message: `Queued ${dto.packageIdentifiers.length} update(s) for ${results.length} device(s)`,
    };
  }
}

