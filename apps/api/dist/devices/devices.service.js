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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const client_1 = require("@prisma/client");
let DevicesService = class DevicesService {
    constructor(prisma, realtime) {
        this.prisma = prisma;
        this.realtime = realtime;
    }
    async findAll(options = {}) {
        const where = {};
        if (options.status && options.status !== 'all') {
            where.status = options.status;
        }
        if (options.search) {
            where.OR = [
                { hostname: { contains: options.search, mode: 'insensitive' } },
                { ipAddress: { contains: options.search } },
                { os: { contains: options.search, mode: 'insensitive' } },
            ];
        }
        const devices = await this.prisma.device.findMany({
            where,
            include: {
                _count: {
                    select: { updates: true },
                },
                metrics: true,
            },
            orderBy: { hostname: 'asc' },
        });
        return devices.map((device) => ({
            id: device.id,
            hostname: device.hostname,
            os: device.os,
            osVersion: device.osVersion,
            ipAddress: device.ipAddress,
            macAddress: device.macAddress,
            agentVersion: device.agentVersion,
            status: device.status,
            lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
            enrolledAt: device.enrolledAt.toISOString(),
            pendingUpdates: device._count.updates,
            cpuUsage: device.metrics?.cpuUsage ?? null,
            memoryUsage: device.metrics?.memoryUsage ?? null,
            diskUsage: device.metrics?.diskUsage ?? null,
        }));
    }
    async findOne(id) {
        const device = await this.prisma.device.findUnique({
            where: { id },
            include: {
                updates: {
                    orderBy: [{ severity: 'asc' }, { packageName: 'asc' }],
                },
                metrics: true,
            },
        });
        if (!device) {
            throw new common_1.NotFoundException(`Device ${id} not found`);
        }
        return {
            id: device.id,
            hostname: device.hostname,
            os: device.os,
            osVersion: device.osVersion,
            ipAddress: device.ipAddress,
            macAddress: device.macAddress,
            agentVersion: device.agentVersion,
            status: device.status,
            lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
            enrolledAt: device.enrolledAt.toISOString(),
            pendingUpdates: device.updates.length,
            cpuUsage: device.metrics?.cpuUsage ?? null,
            memoryUsage: device.metrics?.memoryUsage ?? null,
            diskUsage: device.metrics?.diskUsage ?? null,
            updates: device.updates.map((u) => ({
                id: u.id,
                packageIdentifier: u.packageIdentifier,
                packageName: u.packageName,
                installedVersion: u.installedVersion,
                availableVersion: u.availableVersion,
                source: u.source,
                severity: u.severity,
                size: u.size,
                description: u.description,
                publishedAt: u.publishedAt?.toISOString() ?? null,
            })),
        };
    }
    async getDeviceUpdates(deviceId) {
        const device = await this.prisma.device.findUnique({
            where: { id: deviceId },
        });
        if (!device) {
            throw new common_1.NotFoundException(`Device ${deviceId} not found`);
        }
        const updates = await this.prisma.deviceUpdate.findMany({
            where: { deviceId },
            orderBy: [{ severity: 'asc' }, { packageName: 'asc' }],
        });
        return updates.map((u) => ({
            id: u.id,
            deviceId: u.deviceId,
            deviceHostname: device.hostname,
            packageIdentifier: u.packageIdentifier,
            packageName: u.packageName,
            installedVersion: u.installedVersion,
            availableVersion: u.availableVersion,
            source: u.source,
            severity: u.severity,
            size: u.size,
            description: u.description,
            publishedAt: u.publishedAt?.toISOString() ?? null,
        }));
    }
    async markStaleDevicesOffline(staleThresholdMinutes = 1.5) {
        const threshold = new Date();
        threshold.setMinutes(threshold.getMinutes() - staleThresholdMinutes);
        const staleDevices = await this.prisma.device.findMany({
            where: {
                status: client_1.DeviceStatus.online,
                lastSeenAt: { lt: threshold },
            },
        });
        if (staleDevices.length > 0) {
            for (const device of staleDevices) {
                await this.prisma.device.update({
                    where: { id: device.id },
                    data: { status: client_1.DeviceStatus.offline },
                });
                this.realtime.broadcastDeviceStatusChange(device.id, client_1.DeviceStatus.offline, device.lastSeenAt || new Date());
            }
        }
        return {
            markedOffline: staleDevices.length,
            devices: staleDevices.map((d) => d.id),
        };
    }
    async installUpdates(deviceId, dto) {
        const device = await this.prisma.device.findUnique({
            where: { id: deviceId },
        });
        if (!device) {
            throw new common_1.NotFoundException(`Device ${deviceId} not found`);
        }
        if (device.status !== client_1.DeviceStatus.online) {
            throw new common_1.NotFoundException(`Device ${deviceId} is offline and cannot receive commands`);
        }
        const updates = await this.prisma.deviceUpdate.findMany({
            where: {
                deviceId,
                packageIdentifier: { in: dto.packageIdentifiers },
            },
        });
        if (updates.length === 0) {
            throw new common_1.NotFoundException(`No updates found for device ${deviceId} with the specified package identifiers`);
        }
        const command = await this.prisma.command.create({
            data: {
                deviceId,
                type: 'install_updates',
                packageIdentifiers: dto.packageIdentifiers,
                status: 'pending',
            },
        });
        for (const update of updates) {
            await this.prisma.updateEvent.create({
                data: {
                    deviceId,
                    action: 'install_triggered',
                    packageIdentifier: update.packageIdentifier,
                    version: update.availableVersion,
                    status: 'pending',
                    message: `Installation queued (command: ${command.id})`,
                },
            });
        }
        this.realtime.broadcastUpdateInstallationStarted(deviceId, dto.packageIdentifiers, command.id);
        return {
            success: true,
            commandId: command.id,
            deviceId,
            packagesQueued: updates.length,
            message: `Installation command queued for device ${device.hostname}`,
        };
    }
};
exports.DevicesService = DevicesService;
exports.DevicesService = DevicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway])
], DevicesService);
//# sourceMappingURL=devices.service.js.map