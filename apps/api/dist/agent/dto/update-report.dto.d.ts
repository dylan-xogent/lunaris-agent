export declare class UpdateItemDto {
    packageIdentifier: string;
    packageName: string;
    installedVersion?: string;
    availableVersion: string;
    source: string;
}
export declare class UpdateReportDto {
    deviceId: string;
    updates: UpdateItemDto[];
}
