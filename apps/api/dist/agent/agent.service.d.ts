import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { UpdateReportDto } from './dto/update-report.dto';
export declare class AgentService {
    private readonly prisma;
    private readonly realtime;
    constructor(prisma: PrismaService, realtime: RealtimeGateway);
    registerDevice(dto: RegisterDeviceDto): Promise<{
        deviceId: string;
        message: string;
    }>;
    processHeartbeat(dto: HeartbeatDto): Promise<{
        status: string;
        serverTime: string;
    }>;
    processUpdateReport(dto: UpdateReportDto): Promise<{
        received: number;
        message: string;
    }>;
    getPendingCommands(deviceId: string): Promise<{
        commands: any;
    }>;
    completeCommand(commandId: string, dto: {
        success: boolean;
        result?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    private determineSeverity;
}
