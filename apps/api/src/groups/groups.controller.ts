import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddDevicesToGroupDto } from './dto/add-devices-to-group.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Get()
  findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }

  @Post(':id/devices')
  @HttpCode(HttpStatus.OK)
  addDevices(@Param('id') id: string, @Body() dto: AddDevicesToGroupDto) {
    return this.groupsService.addDevices(id, dto);
  }

  @Delete(':groupId/devices/:deviceId')
  @HttpCode(HttpStatus.OK)
  removeDevice(
    @Param('groupId') groupId: string,
    @Param('deviceId') deviceId: string,
  ) {
    return this.groupsService.removeDevice(groupId, deviceId);
  }
}
