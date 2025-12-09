import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { InstallUpdateDto } from './dto/install-update.dto';
interface FindAllOptions {
    status?: string;
    search?: string;
}
export declare class DevicesService {
    private readonly prisma;
    private readonly realtime;
    constructor(prisma: PrismaService, realtime: RealtimeGateway);
    findAll(options?: FindAllOptions): Promise<{
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
    getDeviceUpdates(deviceId: string): Promise<{
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
    markStaleDevicesOffline(staleThresholdMinutes?: number): Promise<{
        markedOffline: number;
        devices: string[];
    }>;
    installUpdates(deviceId: string, dto: InstallUpdateDto): Promise<{
        success: boolean;
        commandId: any;
        deviceId: string;
        packagesQueued: number;
        message: string;
    }>;
}
export {};
