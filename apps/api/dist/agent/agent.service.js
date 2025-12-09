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
exports.AgentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const client_1 = require("@prisma/client");
let AgentService = class AgentService {
    constructor(prisma, realtime) {
        this.prisma = prisma;
        this.realtime = realtime;
    }
    async registerDevice(dto) {
        const existingDevice = await this.prisma.device.findUnique({
            where: { macAddress: dto.macAddress },
        });
        if (existingDevice) {
            const updatedDevice = await this.prisma.device.update({
                where: { id: existingDevice.id },
                data: {
                    hostname: dto.hostname,
                    os: dto.os,
                    osVersion: dto.osVersion,
                    agentVersion: dto.agentVersion,
                    status: client_1.DeviceStatus.online,
                    lastSeenAt: new Date(),
                },
            });
            this.realtime.broadcastDeviceStatusChange(updatedDevice.id, client_1.DeviceStatus.online, updatedDevice.lastSeenAt);
            return {
                deviceId: updatedDevice.id,
                message: 'Device re-registered successfully',
            };
        }
        const device = await this.prisma.device.create({
            data: {
                hostname: dto.hostname,
                os: dto.os,
                osVersion: dto.osVersion,
                macAddress: dto.macAddress,
                agentVersion: dto.agentVersion,
                status: client_1.DeviceStatus.online,
                lastSeenAt: new Date(),
            },
        });
        this.realtime.broadcastDeviceRegistered(device);
        return {
            deviceId: device.id,
            message: 'Device registered successfully',
        };
    }
    async processHeartbeat(dto) {
        const device = await this.prisma.device.findUnique({
            where: { id: dto.deviceId },
        });
        if (!device) {
            throw new common_1.NotFoundException(`Device ${dto.deviceId} not found`);
        }
        const wasOffline = device.status === client_1.DeviceStatus.offline;
        const now = new Date();
        await this.prisma.device.update({
            where: { id: dto.deviceId },
            data: {
                status: client_1.DeviceStatus.online,
                lastSeenAt: now,
                ipAddress: dto.ipAddress,
            },
        });
        if (dto.cpuUsage !== undefined || dto.memoryUsage !== undefined || dto.diskUsage !== undefined) {
            await this.prisma.deviceMetrics.upsert({
                where: { deviceId: dto.deviceId },
                create: {
                    deviceId: dto.deviceId,
                    cpuUsage: dto.cpuUsage,
                    memoryUsage: dto.memoryUsage,
                    diskUsage: dto.diskUsage,
                },
                update: {
                    cpuUsage: dto.cpuUsage,
                    memoryUsage: dto.memoryUsage,
                    diskUsage: dto.diskUsage,
                },
            });
        }
        this.realtime.broadcastDeviceStatusChange(dto.deviceId, client_1.DeviceStatus.online, now);
        return {
            status: 'ok',
            serverTime: new Date().toISOString(),
        };
    }
    async processUpdateReport(dto) {
        const device = await this.prisma.device.findUnique({
            where: { id: dto.deviceId },
        });
        if (!device) {
            throw new common_1.NotFoundException(`Device ${dto.deviceId} not found`);
        }
        const currentUpdates = await this.prisma.deviceUpdate.findMany({
            where: { deviceId: dto.deviceId },
        });
        const currentUpdateIds = new Set(currentUpdates.map((u) => u.packageIdentifier));
        const reportedUpdateIds = new Set(dto.updates.map((u) => u.packageIdentifier));
        const toDelete = currentUpdates.filter((u) => !reportedUpdateIds.has(u.packageIdentifier));
        if (toDelete.length > 0) {
            await this.prisma.deviceUpdate.deleteMany({
                where: {
                    id: { in: toDelete.map((u) => u.id) },
                },
            });
            for (const update of toDelete) {
                await this.prisma.updateEvent.create({
                    data: {
                        deviceId: dto.deviceId,
                        action: 'installed',
                        packageIdentifier: update.packageIdentifier,
                        version: update.availableVersion,
                        status: 'completed',
                        message: 'Update installed (no longer reported)',
                    },
                });
            }
        }
        for (const update of dto.updates) {
            const severity = this.determineSeverity(update.packageName);
            await this.prisma.deviceUpdate.upsert({
                where: {
                    deviceId_packageIdentifier: {
                        deviceId: dto.deviceId,
                        packageIdentifier: update.packageIdentifier,
                    },
                },
                create: {
                    deviceId: dto.deviceId,
                    packageIdentifier: update.packageIdentifier,
                    packageName: update.packageName,
                    installedVersion: update.installedVersion,
                    availableVersion: update.availableVersion,
                    source: update.source,
                    severity,
                },
                update: {
                    packageName: update.packageName,
                    installedVersion: update.installedVersion,
                    availableVersion: update.availableVersion,
                    source: update.source,
                },
            });
            if (!currentUpdateIds.has(update.packageIdentifier)) {
                await this.prisma.updateEvent.create({
                    data: {
                        deviceId: dto.deviceId,
                        action: 'detected',
                        packageIdentifier: update.packageIdentifier,
                        version: update.availableVersion,
                        status: 'completed',
                    },
                });
            }
        }
        const updateCount = await this.prisma.deviceUpdate.count({
            where: { deviceId: dto.deviceId },
        });
        const criticalCount = await this.prisma.deviceUpdate.count({
            where: {
                deviceId: dto.deviceId,
                severity: client_1.UpdateSeverity.critical,
            },
        });
        this.realtime.broadcastDeviceUpdatesChanged(dto.deviceId, updateCount, criticalCount);
        return {
            received: dto.updates.length,
            message: 'Update report processed successfully',
        };
    }
    async getPendingCommands(deviceId) {
        const commands = await this.prisma.command.findMany({
            where: {
                deviceId,
                status: 'pending',
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        if (commands.length > 0) {
            await this.prisma.command.updateMany({
                where: {
                    id: { in: commands.map(c => c.id) },
                },
                data: {
                    status: 'executing',
                    executedAt: new Date(),
                },
            });
        }
        return {
            commands: commands.map(cmd => ({
                id: cmd.id,
                type: cmd.type,
                packageIdentifiers: cmd.packageIdentifiers,
                createdAt: cmd.createdAt,
            })),
        };
    }
    async completeCommand(commandId, dto) {
        const command = await this.prisma.command.findUnique({
            where: { id: commandId },
        });
        if (!command) {
            throw new common_1.NotFoundException(`Command ${commandId} not found`);
        }
        await this.prisma.command.update({
            where: { id: commandId },
            data: {
                status: dto.success ? 'completed' : 'failed',
                result: dto.result,
                completedAt: new Date(),
            },
        });
        return {
            success: true,
            message: 'Command marked as completed',
        };
    }
    determineSeverity(packageName) {
        const name = packageName.toLowerCase();
        if (name.includes('security') ||
            name.includes('defender') ||
            name.includes('antivirus') ||
            name.includes('critical')) {
            return client_1.UpdateSeverity.critical;
        }
        if (name.includes('framework') ||
            name.includes('runtime') ||
            name.includes('driver') ||
            name.includes('office')) {
            return client_1.UpdateSeverity.important;
        }
        return client_1.UpdateSeverity.optional;
    }
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway])
], AgentService);
//# sourceMappingURL=agent.service.js.map