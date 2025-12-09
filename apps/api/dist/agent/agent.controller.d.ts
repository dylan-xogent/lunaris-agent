import { AgentService } from './agent.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { CompleteCommandDto } from './dto/complete-command.dto';
export declare class AgentController {
    private readonly agentService;
    constructor(agentService: AgentService);
    register(dto: RegisterDeviceDto): Promise<{
        deviceId: string;
        message: string;
    }>;
    heartbeat(dto: HeartbeatDto): Promise<{
        status: string;
        serverTime: string;
    }>;
    updateReport(dto: UpdateReportDto): Promise<{
        received: number;
        message: string;
    }>;
    getPendingCommands(deviceId: string): Promise<{
        commands: any;
    }>;
    completeCommand(commandId: string, dto: CompleteCommandDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
