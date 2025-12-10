import { Controller, Get, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Get system health status
   * Returns 200 if healthy, 503 if unhealthy
   */
  @Get()
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({
    status: 200,
    description: 'System is healthy',
  })
  @ApiResponse({
    status: 503,
    description: 'System is unhealthy or degraded',
  })
  async getHealth() {
    const health = await this.healthService.getHealth();

    // Return 503 if system is unhealthy
    if (health.status === 'unhealthy') {
      throw new Error('System is unhealthy');
    }

    return health;
  }

  /**
   * Liveness probe endpoint
   * Always returns 200 if the API is running
   */
  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({
    status: 200,
    description: 'API is alive',
  })
  async getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe endpoint
   * Returns 200 if the API is ready to accept traffic
   */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({
    status: 200,
    description: 'API is ready',
  })
  @ApiResponse({
    status: 503,
    description: 'API is not ready',
  })
  async getReadiness() {
    const health = await this.healthService.getHealth();

    if (health.checks.database.status === 'unhealthy') {
      throw new Error('Database is not ready');
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }
}
