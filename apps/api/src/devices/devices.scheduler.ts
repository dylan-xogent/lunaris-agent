import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DevicesService } from './devices.service';

@Injectable()
export class DevicesScheduler {
  private readonly logger = new Logger(DevicesScheduler.name);

  constructor(private readonly devicesService: DevicesService) {}

  /**
   * Mark stale devices as offline every minute
   * Devices that haven't sent a heartbeat in 1.5 minutes (3 missed heartbeats) are marked offline
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleStaleDevices() {
    this.logger.debug('Running stale device detection...');

    try {
      const result = await this.devicesService.markStaleDevicesOffline(1.5);

      if (result.markedOffline > 0) {
        this.logger.log(
          `Marked ${result.markedOffline} device(s) as offline (stale threshold: 1.5 minutes / 3 missed heartbeats)`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to mark stale devices offline: ${error.message}`,
        error.stack,
      );
    }
  }
}
