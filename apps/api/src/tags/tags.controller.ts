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
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { AddDevicesToTagDto } from './dto/add-devices-to-tag.dto';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }

  @Post(':id/devices')
  @HttpCode(HttpStatus.OK)
  addDevices(@Param('id') id: string, @Body() dto: AddDevicesToTagDto) {
    return this.tagsService.addDevices(id, dto);
  }

  @Delete(':tagId/devices/:deviceId')
  @HttpCode(HttpStatus.OK)
  removeDevice(
    @Param('tagId') tagId: string,
    @Param('deviceId') deviceId: string,
  ) {
    return this.tagsService.removeDevice(tagId, deviceId);
  }
}
