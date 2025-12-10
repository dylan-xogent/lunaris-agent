import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityEventType, Prisma } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get activity events with filtering and pagination
   */
  async getEvents(params: {
    limit?: number;
    offset?: number;
    type?: string;
    deviceId?: string;
  }) {
    const { limit = 50, offset = 0, type, deviceId } = params;

    const where: Prisma.ActivityEventWhereInput = {};

    if (type && type !== 'all') {
      where.type = type as ActivityEventType;
    }

    if (deviceId) {
      where.deviceId = deviceId;
    }

    const [events, total] = await Promise.all([
      this.prisma.activityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.activityEvent.count({ where }),
    ]);

    return {
      events,
      total,
      limit,
      offset,
    };
  }

  /**
   * Create a new activity event
   */
  async createEvent(data: {
    type: ActivityEventType;
    deviceId?: string;
    deviceName?: string;
    title: string;
    description?: string;
    metadata?: any;
  }) {
    return this.prisma.activityEvent.create({
      data: {
        type: data.type,
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        title: data.title,
        description: data.description,
        metadata: data.metadata || Prisma.JsonNull,
      },
    });
  }

  /**
   * Get recent events (last 24 hours)
   */
  async getRecentEvents(limit: number = 20) {
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const where = {
      createdAt: {
        gte: yesterday,
      },
    };

    const [events, total] = await Promise.all([
      this.prisma.activityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.activityEvent.count({ where }),
    ]);

    return {
      events,
      total,
      limit,
      offset: 0,
    };
  }
}
