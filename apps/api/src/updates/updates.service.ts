import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSeverity } from '@prisma/client';

interface FindAllOptions {
  severity?: string;
  deviceId?: string;
  search?: string;
}

@Injectable()
export class UpdatesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all updates with filtering
   */
  async findAll(options: FindAllOptions = {}) {
    const where: any = {};

    // Filter by severity
    if (options.severity && options.severity !== 'all') {
      where.severity = options.severity as UpdateSeverity;
    }

    // Filter by device
    if (options.deviceId) {
      where.deviceId = options.deviceId;
    }

    // Search by package name or device hostname
    if (options.search) {
      where.OR = [
        { packageName: { contains: options.search, mode: 'insensitive' } },
        { packageIdentifier: { contains: options.search, mode: 'insensitive' } },
        {
          device: {
            hostname: { contains: options.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const updates = await this.prisma.deviceUpdate.findMany({
      where,
      include: {
        device: {
          select: {
            id: true,
            hostname: true,
          },
        },
      },
      orderBy: [{ severity: 'asc' }, { packageName: 'asc' }],
    });

    return updates.map((u) => ({
      id: u.id,
      deviceId: u.deviceId,
      deviceHostname: u.device.hostname,
      packageIdentifier: u.packageIdentifier,
      packageName: u.packageName,
      currentVersion: u.installedVersion,
      availableVersion: u.availableVersion,
      source: u.source,
      severity: u.severity,
      size: u.size,
      description: u.description,
      publishedAt: u.publishedAt?.toISOString() ?? null,
    }));
  }
}

