import { DevicesService } from './devices.service';
export declare class DevicesScheduler {
    private readonly devicesService;
    private readonly logger;
    constructor(devicesService: DevicesService);
    handleStaleDevices(): Promise<void>;
}
