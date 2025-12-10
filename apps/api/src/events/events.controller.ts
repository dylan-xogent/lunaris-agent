import { Controller, Get, Query } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Get activity events with filtering and pagination
   * GET /api/events?limit=50&offset=0&type=all|device|update&deviceId=uuid
   */
  @Get()
  async getEvents(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('type') type?: string,
    @Query('deviceId') deviceId?: string,
  ) {
    return this.eventsService.getEvents({
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
      type,
      deviceId,
    });
  }

  /**
   * Get recent events (last 24 hours)
   * GET /api/events/recent?limit=20
   */
  @Get('recent')
  async getRecentEvents(@Query('limit') limit?: string) {
    return this.eventsService.getRecentEvents(
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
