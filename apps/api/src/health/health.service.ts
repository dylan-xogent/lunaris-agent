import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfig } from '../config/configuration';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    memory: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      usedMB: number;
      totalMB: number;
      usagePercent: number;
    };
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  async getHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();

    // Check database connectivity
    const dbCheck = await this.checkDatabase();

    // Check memory usage
    const memoryCheck = this.checkMemory();

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (dbCheck.status === 'unhealthy') {
      status = 'unhealthy';
    } else if (memoryCheck.status === 'degraded' || memoryCheck.status === 'unhealthy') {
      status = memoryCheck.status;
    }

    return {
      status,
      timestamp,
      uptime,
      checks: {
        database: dbCheck,
        memory: memoryCheck,
      },
    };
  }

  private async checkDatabase(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
      // Simple query to test database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  private checkMemory(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    usedMB: number;
    totalMB: number;
    usagePercent: number;
  } {
    const memoryUsage = process.memoryUsage();
    const totalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const usedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const usagePercent = Math.round((usedMB / totalMB) * 100);

    const warningThreshold = this.configService.get('healthCheckMemoryThresholdWarning') || 75;
    const criticalThreshold = this.configService.get('healthCheckMemoryThresholdCritical') || 90;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (usagePercent >= criticalThreshold) {
      status = 'unhealthy';
    } else if (usagePercent >= warningThreshold) {
      status = 'degraded';
    }

    return {
      status,
      usedMB,
      totalMB,
      usagePercent,
    };
  }
}
