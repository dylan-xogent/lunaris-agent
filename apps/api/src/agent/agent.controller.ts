import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Patch } from '@nestjs/common';
import { AgentService } from './agent.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { CompleteCommandDto } from './dto/complete-command.dto';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  /**
   * Register a new device with the platform
   * Called once when agent first starts
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDeviceDto) {
    return this.agentService.registerDevice(dto);
  }

  /**
   * Send heartbeat to update device status
   * Called periodically by agent (e.g., every 30 seconds)
   */
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  async heartbeat(@Body() dto: HeartbeatDto) {
    return this.agentService.processHeartbeat(dto);
  }

  /**
   * Report available updates for a device
   * Called after agent scans for updates
   */
  @Post('update-report')
  @HttpCode(HttpStatus.OK)
  async updateReport(@Body() dto: UpdateReportDto) {
    return this.agentService.processUpdateReport(dto);
  }

  /**
   * Get pending commands for a device
   * Called periodically by agent to check for commands (polling)
   */
  @Get('commands/:deviceId')
  @HttpCode(HttpStatus.OK)
  async getPendingCommands(@Param('deviceId') deviceId: string) {
    return this.agentService.getPendingCommands(deviceId);
  }

  /**
   * Mark a command as completed
   * Called by agent after executing a command
   */
  @Patch('commands/:commandId/complete')
  @HttpCode(HttpStatus.OK)
  async completeCommand(
    @Param('commandId') commandId: string,
    @Body() dto: CompleteCommandDto,
  ) {
    return this.agentService.completeCommand(commandId, dto);
  }
}

