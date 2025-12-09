import { Controller, Get, Post, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { InstallUpdateDto } from './dto/install-update.dto';
import { BulkAddToGroupDto } from './dto/bulk-add-to-group.dto';
import { BulkAddTagsDto } from './dto/bulk-add-tags.dto';
import { BulkInstallUpdatesDto } from './dto/bulk-install-updates.dto';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  /**
   * Get all devices with optional filtering
   */
  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.devicesService.findAll({ status, search });
  }

  /**
   * Get a single device by ID with all details
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  /**
   * Get updates for a specific device
   */
  @Get(':id/updates')
  async getDeviceUpdates(@Param('id') id: string) {
    return this.devicesService.getDeviceUpdates(id);
  }

  /**
   * Trigger update installation on a device
   */
  @Post(':id/install-updates')
  async installUpdates(
    @Param('id') id: string,
    @Body() dto: InstallUpdateDto,
  ) {
    return this.devicesService.installUpdates(id, dto);
  }

  /**
   * Bulk add devices to a group
   */
  @Post('bulk/add-to-group')
  @HttpCode(HttpStatus.OK)
  async bulkAddToGroup(@Body() dto: BulkAddToGroupDto) {
    return this.devicesService.bulkAddToGroup(dto);
  }

  /**
   * Bulk add tags to devices
   */
  @Post('bulk/add-tags')
  @HttpCode(HttpStatus.OK)
  async bulkAddTags(@Body() dto: BulkAddTagsDto) {
    return this.devicesService.bulkAddTags(dto);
  }

  /**
   * Bulk install updates on multiple devices
   */
  @Post('bulk/install-updates')
  @HttpCode(HttpStatus.OK)
  async bulkInstallUpdates(@Body() dto: BulkInstallUpdatesDto) {
    return this.devicesService.bulkInstallUpdates(dto);
  }
}

