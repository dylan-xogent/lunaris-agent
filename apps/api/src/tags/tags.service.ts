import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { AddDevicesToTagDto } from './dto/add-devices-to-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new tag
   */
  async create(dto: CreateTagDto) {
    // Check if tag name already exists
    const existing = await this.prisma.tag.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Tag with name "${dto.name}" already exists`);
    }

    const tag = await this.prisma.tag.create({
      data: {
        name: dto.name,
        color: dto.color || '#10B981',
      },
    });

    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      deviceCount: 0,
      createdAt: tag.createdAt.toISOString(),
    };
  }

  /**
   * Get all tags with device counts
   */
  async findAll() {
    const tags = await this.prisma.tag.findMany({
      include: {
        _count: {
          select: { devices: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      deviceCount: tag._count.devices,
      createdAt: tag.createdAt.toISOString(),
    }));
  }

  /**
   * Get a single tag with its devices
   */
  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({
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

    if (!tag) {
      throw new NotFoundException(`Tag ${id} not found`);
    }

    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      devices: tag.devices.map((membership) => ({
        id: membership.device.id,
        hostname: membership.device.hostname,
        os: membership.device.os,
        status: membership.device.status,
        lastSeenAt: membership.device.lastSeenAt?.toISOString() ?? null,
        addedAt: membership.addedAt.toISOString(),
      })),
      createdAt: tag.createdAt.toISOString(),
    };
  }

  /**
   * Update a tag
   */
  async update(id: string, dto: UpdateTagDto) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException(`Tag ${id} not found`);
    }

    // Check name uniqueness if changing name
    if (dto.name && dto.name !== tag.name) {
      const existing = await this.prisma.tag.findUnique({
        where: { name: dto.name },
      });

      if (existing) {
        throw new ConflictException(`Tag with name "${dto.name}" already exists`);
      }
    }

    const updated = await this.prisma.tag.update({
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
      color: updated.color,
      deviceCount: updated._count.devices,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Delete a tag
   */
  async remove(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException(`Tag ${id} not found`);
    }

    await this.prisma.tag.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Tag "${tag.name}" deleted successfully`,
    };
  }

  /**
   * Add devices to a tag
   */
  async addDevices(id: string, dto: AddDevicesToTagDto) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException(`Tag ${id} not found`);
    }

    // Verify all devices exist
    const devices = await this.prisma.device.findMany({
      where: { id: { in: dto.deviceIds } },
    });

    if (devices.length !== dto.deviceIds.length) {
      throw new NotFoundException('One or more device IDs are invalid');
    }

    // Add devices to tag (skip duplicates)
    const memberships = await Promise.all(
      dto.deviceIds.map((deviceId) =>
        this.prisma.deviceTag.upsert({
          where: {
            deviceId_tagId: {
              deviceId,
              tagId: id,
            },
          },
          create: {
            deviceId,
            tagId: id,
          },
          update: {},
        }),
      ),
    );

    return {
      success: true,
      tagId: id,
      devicesAdded: memberships.length,
      message: `Added ${memberships.length} device(s) to tag "${tag.name}"`,
    };
  }

  /**
   * Remove a device from a tag
   */
  async removeDevice(tagId: string, deviceId: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      throw new NotFoundException(`Tag ${tagId} not found`);
    }

    const membership = await this.prisma.deviceTag.findUnique({
      where: {
        deviceId_tagId: {
          deviceId,
          tagId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException(
        `Device ${deviceId} does not have tag "${tag.name}"`,
      );
    }

    await this.prisma.deviceTag.delete({
      where: {
        deviceId_tagId: {
          deviceId,
          tagId,
        },
      },
    });

    return {
      success: true,
      message: `Tag "${tag.name}" removed from device`,
    };
  }
}
