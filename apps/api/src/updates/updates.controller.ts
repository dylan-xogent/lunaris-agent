import { Controller, Get, Query } from '@nestjs/common';
import { UpdatesService } from './updates.service';

@Controller('updates')
export class UpdatesController {
  constructor(private readonly updatesService: UpdatesService) {}

  /**
   * Get all updates across all devices with optional filtering
   */
  @Get()
  async findAll(
    @Query('severity') severity?: string,
    @Query('deviceId') deviceId?: string,
    @Query('search') search?: string,
  ) {
    return this.updatesService.findAll({ severity, deviceId, search });
  }
}

