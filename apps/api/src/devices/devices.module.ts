import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { DevicesScheduler } from './devices.scheduler';
import { RealtimeModule } from '../realtime/realtime.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [RealtimeModule, EventsModule],
  controllers: [DevicesController],
  providers: [DevicesService, DevicesScheduler],
  exports: [DevicesService],
})
export class DevicesModule {}

