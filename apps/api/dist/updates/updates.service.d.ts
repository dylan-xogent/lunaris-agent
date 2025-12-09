import { PrismaService } from '../prisma/prisma.service';
interface FindAllOptions {
    severity?: string;
    deviceId?: string;
    search?: string;
}
export declare class UpdatesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(options?: FindAllOptions): Promise<{
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
export {};
