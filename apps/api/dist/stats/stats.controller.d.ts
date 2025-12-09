import { StatsService } from './stats.service';
export declare class StatsController {
    private readonly statsService;
    constructor(statsService: StatsService);
    getStats(): Promise<{
        totalDevices: number;
        onlineDevices: number;
        offlineDevices: number;
        devicesWithUpdates: number;
        totalPendingUpdates: number;
        criticalUpdates: number;
        onlinePercentage: number;
    }>;
}
