import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DeviceStatus } from '@prisma/client';
export declare class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    afterInit(): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinDevice(client: Socket, deviceId: string): {
        success: boolean;
        deviceId: string;
    };
    broadcastDeviceStatusChange(deviceId: string, status: DeviceStatus, lastSeenAt: Date): void;
    broadcastDeviceUpdatesChanged(deviceId: string, pendingUpdates: number, criticalUpdates: number): void;
    broadcastDeviceRegistered(device: any): void;
    broadcastDeviceRemoved(deviceId: string): void;
    sendInstallCommand(deviceId: string, packageIdentifiers: string[], commandId: string): void;
    broadcastUpdateInstallationStarted(deviceId: string, packageIdentifiers: string[], commandId: string): void;
}
