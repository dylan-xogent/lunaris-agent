import { PrismaService } from '../prisma/prisma.service';
export declare class StatsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(): Promise<{
        totalDevices: number;
        onlineDevices: number;
        offlineDevices: number;
        devicesWithUpdates: number;
        totalPendingUpdates: number;
        criticalUpdates: number;
        onlinePercentage: number;
    }>;
}
