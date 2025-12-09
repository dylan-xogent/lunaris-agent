import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddDevicesToGroupDto } from './dto/add-devices-to-group.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new group
   */
  async create(dto: CreateGroupDto) {
    // Check if group name already exists
    const existing = await this.prisma.group.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Group with name "${dto.name}" already exists`);
    }

    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
        color: dto.color || '#3B82F6',
      },
    });

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      color: group.color,
      deviceCount: 0,
      createdAt: group.createdAt.toISOString(),
    };
  }

  /**
   * Get all groups with device counts
   */
  async findAll() {
    const groups = await this.prisma.group.findMany({
      include: {
        _count: {
          select: { devices: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      color: group.color,
      deviceCount: group._count.devices,
      createdAt: group.createdAt.toISOString(),
    }));
  }

  /**
   * Get a single group with its devices
   */
  async findOne(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        devices: {
          include: {
            device: {
              select: {
                id: true,
                hostname: true,
                os: true,
                status: true,
                lastSeenAt: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Group ${id} not found`);
    }

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      color: group.color,
      devices: group.devices.map((membership) => ({
        id: membership.device.id,
        hostname: membership.device.hostname,
        os: membership.device.os,
        status: membership.device.status,
        lastSeenAt: membership.device.lastSeenAt?.toISOString() ?? null,
        addedAt: membership.addedAt.toISOString(),
      })),
      createdAt: group.createdAt.toISOString(),
    };
  }

  /**
   * Update a group
   */
  async update(id: string, dto: UpdateGroupDto) {
    const group = await this.prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      throw new NotFoundException(`Group ${id} not found`);
    }

    // Check name uniqueness if changing name
    if (dto.name && dto.name !== group.name) {
      const existing = await this.prisma.group.findUnique({
        where: { name: dto.name },
      });

      if (existing) {
        throw new ConflictException(`Group with name "${dto.name}" already exists`);
      }
    }

    const updated = await this.prisma.group.update({
      where: { id },
      data: dto,
      include: {
        _count: {
          select: { devices: true },
        },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      color: updated.color,
      deviceCount: updated._count.devices,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Delete a group
   */
  async remove(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      throw new NotFoundException(`Group ${id} not found`);
    }

    await this.prisma.group.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Group "${group.name}" deleted successfully`,
    };
  }

  /**
   * Add devices to a group
   */
  async addDevices(id: string, dto: AddDevicesToGroupDto) {
    const group = await this.prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      throw new NotFoundException(`Group ${id} not found`);
    }

    // Verify all devices exist
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
              groupId: id,
            },
          },
          create: {
            deviceId,
            groupId: id,
          },
          update: {},
        }),
      ),
    );

    return {
      success: true,
      groupId: id,
      devicesAdded: memberships.length,
      message: `Added ${memberships.length} device(s) to group "${group.name}"`,
    };
  }

  /**
   * Remove a device from a group
   */
  async removeDevice(groupId: string, deviceId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException(`Group ${groupId} not found`);
    }

    const membership = await this.prisma.deviceGroupMembership.findUnique({
      where: {
        deviceId_groupId: {
          deviceId,
          groupId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException(
        `Device ${deviceId} is not in group "${group.name}"`,
      );
    }

    await this.prisma.deviceGroupMembership.delete({
      where: {
        deviceId_groupId: {
          deviceId,
          groupId,
        },
      },
    });

    return {
      success: true,
      message: `Device removed from group "${group.name}"`,
    };
  }
}
