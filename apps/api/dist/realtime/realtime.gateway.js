"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    constructor() {
        this.logger = new common_1.Logger(RealtimeGateway_1.name);
    }
    afterInit() {
        this.logger.log('WebSocket Gateway initialized');
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinDevice(client, deviceId) {
        client.join(deviceId);
        this.logger.log(`Agent joined device room: ${deviceId} (client: ${client.id})`);
        return { success: true, deviceId };
    }
    broadcastDeviceStatusChange(deviceId, status, lastSeenAt) {
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
    broadcastDeviceUpdatesChanged(deviceId, pendingUpdates, criticalUpdates) {
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
    broadcastDeviceRegistered(device) {
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
    broadcastDeviceRemoved(deviceId) {
        this.server.emit('device_removed', {
            type: 'device_removed',
            payload: { deviceId },
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Broadcast: device_removed for ${deviceId}`);
    }
    sendInstallCommand(deviceId, packageIdentifiers, commandId) {
        this.server.to(deviceId).emit('install_updates', {
            type: 'install_updates',
            payload: {
                commandId,
                deviceId,
                packageIdentifiers,
            },
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Sent install command ${commandId} to device ${deviceId} for ${packageIdentifiers.length} package(s)`);
    }
    broadcastUpdateInstallationStarted(deviceId, packageIdentifiers, commandId) {
        this.server.emit('update_installation_started', {
            type: 'update_installation_started',
            payload: {
                deviceId,
                packageIdentifiers,
                commandId,
            },
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Broadcast: update_installation_started for device ${deviceId}`);
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_device'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleJoinDevice", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true,
        },
        namespace: '/ws/console',
    })
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map