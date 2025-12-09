import { UpdatesService } from './updates.service';
export declare class UpdatesController {
    private readonly updatesService;
    constructor(updatesService: UpdatesService);
    findAll(severity?: string, deviceId?: string, search?: string): Promise<{
        id: string;
        deviceId: string;
        deviceHostname: string;
        packageIdentifier: string;
        packageName: string;
        currentVersion: string | null;
        availableVersion: string;
        source: import("@prisma/client").$Enums.UpdateSource;
        severity: import("@prisma/client").$Enums.UpdateSeverity;
        size: string | null;
        description: string | null;
        publishedAt: string | null;
    }[]>;
}
