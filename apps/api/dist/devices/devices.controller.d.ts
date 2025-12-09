import { DevicesService } from './devices.service';
import { InstallUpdateDto } from './dto/install-update.dto';
export declare class DevicesController {
    private readonly devicesService;
    constructor(devicesService: DevicesService);
    findAll(status?: string, search?: string): Promise<{
        id: string;
        hostname: string;
        os: string;
        osVersion: string;
        ipAddress: string | null;
        macAddress: string;
        agentVersion: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        lastSeenAt: string | null;
        enrolledAt: string;
        pendingUpdates: number;
        cpuUsage: number | null;
        memoryUsage: number | null;
        diskUsage: number | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        hostname: string;
        os: string;
        osVersion: string;
        ipAddress: string | null;
        macAddress: string;
        agentVersion: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        lastSeenAt: string | null;
        enrolledAt: string;
        pendingUpdates: number;
        cpuUsage: number | null;
        memoryUsage: number | null;
        diskUsage: number | null;
        updates: {
            id: string;
            packageIdentifier: string;
            packageName: string;
            installedVersion: string | null;
            availableVersion: string;
            source: import("@prisma/client").$Enums.UpdateSource;
            severity: import("@prisma/client").$Enums.UpdateSeverity;
            size: string | null;
            description: string | null;
            publishedAt: string | null;
        }[];
    }>;
    getDeviceUpdates(id: string): Promise<{
        id: string;
        deviceId: string;
        deviceHostname: string;
        packageIdentifier: string;
        packageName: string;
        installedVersion: string | null;
        availableVersion: string;
        source: import("@prisma/client").$Enums.UpdateSource;
        severity: import("@prisma/client").$Enums.UpdateSeverity;
        size: string | null;
        description: string | null;
        publishedAt: string | null;
    }[]>;
    installUpdates(id: string, dto: InstallUpdateDto): Promise<{
        success: boolean;
        commandId: any;
        deviceId: string;
        packagesQueued: number;
        message: string;
    }>;
}
