import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { DeviceStatus } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/ws/console',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Handle agent joining its device-specific room
   * Agents call this when they connect to receive device-specific commands
   */
  @SubscribeMessage('join_device')
  handleJoinDevice(client: Socket, deviceId: string) {
    client.join(deviceId);
    this.logger.log(`Agent joined device room: ${deviceId} (client: ${client.id})`);
    return { success: true, deviceId };
  }

  /**
   * Broadcast device status change to all connected clients
   */
  broadcastDeviceStatusChange(
    deviceId: string,
    status: DeviceStatus,
    lastSeenAt: Date,
  ) {
    this.server.emit('device_status_change', {
      type: 'device_status_change',
      payload: {
        deviceId,
        status,
        lastSeenAt: lastSeenAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Broadcast: device_status_change for ${deviceId}`);
  }

  /**
   * Broadcast device updates changed to all connected clients
   */
  broadcastDeviceUpdatesChanged(
    deviceId: string,
    pendingUpdates: number,
    criticalUpdates: number,
  ) {
    this.server.emit('device_updates_changed', {
      type: 'device_updates_changed',
      payload: {
        deviceId,
        pendingUpdates,
        criticalUpdates,
      },
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Broadcast: device_updates_changed for ${deviceId}`);
  }

  /**
   * Broadcast new device registration to all connected clients
   */
  broadcastDeviceRegistered(device: any) {
    this.server.emit('device_registered', {
      type: 'device_registered',
      payload: {
        device: {
          id: device.id,
          hostname: device.hostname,
          os: device.os,
          osVersion: device.osVersion,
          status: device.status,
        },
      },
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Broadcast: device_registered for ${device.hostname}`);
  }

  /**
   * Broadcast device removal to all connected clients
   */
  broadcastDeviceRemoved(deviceId: string) {
    this.server.emit('device_removed', {
      type: 'device_removed',
      payload: { deviceId },
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Broadcast: device_removed for ${deviceId}`);
  }

  /**
   * Send install command to a specific device (agent)
   * This is sent to the agent's specific room/connection
   */
  sendInstallCommand(
    deviceId: string,
    packageIdentifiers: string[],
    commandId: string,
  ) {
    // Emit to device-specific room (agents should join room with their deviceId)
    this.server.to(deviceId).emit('install_updates', {
      type: 'install_updates',
      payload: {
        commandId,
        deviceId,
        packageIdentifiers,
      },
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Sent install command ${commandId} to device ${deviceId} for ${packageIdentifiers.length} package(s)`,
    );
  }

  /**
   * Broadcast update installation started event
   */
  broadcastUpdateInstallationStarted(
    deviceId: string,
    packageIdentifiers: string[],
    commandId: string,
  ) {
    this.server.emit('update_installation_started', {
      type: 'update_installation_started',
      payload: {
        deviceId,
        packageIdentifiers,
        commandId,
      },
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(
      `Broadcast: update_installation_started for device ${deviceId}`,
    );
  }
}

