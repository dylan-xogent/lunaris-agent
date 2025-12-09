import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { DevicesModule } from './devices/devices.module';
import { AgentModule } from './agent/agent.module';
import { UpdatesModule } from './updates/updates.module';
import { RealtimeModule } from './realtime/realtime.module';
import { StatsModule } from './stats/stats.module';
import { GroupsModule } from './groups/groups.module';
import { TagsModule } from './tags/tags.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    DevicesModule,
    AgentModule,
    UpdatesModule,
    RealtimeModule,
    StatsModule,
    GroupsModule,
    TagsModule,
  ],
})
export class AppModule {}

