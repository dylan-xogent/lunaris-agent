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
exports.UpdatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UpdatesService = class UpdatesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(options = {}) {
        const where = {};
        if (options.severity && options.severity !== 'all') {
            where.severity = options.severity;
        }
        if (options.deviceId) {
            where.deviceId = options.deviceId;
        }
        if (options.search) {
            where.OR = [
                { packageName: { contains: options.search, mode: 'insensitive' } },
                { packageIdentifier: { contains: options.search, mode: 'insensitive' } },
                {
                    device: {
                        hostname: { contains: options.search, mode: 'insensitive' },
                    },
                },
            ];
        }
        const updates = await this.prisma.deviceUpdate.findMany({
            where,
            include: {
                device: {
                    select: {
                        id: true,
                        hostname: true,
                    },
                },
            },
            orderBy: [{ severity: 'asc' }, { packageName: 'asc' }],
        });
        return updates.map((u) => ({
            id: u.id,
            deviceId: u.deviceId,
            deviceHostname: u.device.hostname,
            packageIdentifier: u.packageIdentifier,
            packageName: u.packageName,
            currentVersion: u.installedVersion,
            availableVersion: u.availableVersion,
            source: u.source,
            severity: u.severity,
            size: u.size,
            description: u.description,
            publishedAt: u.publishedAt?.toISOString() ?? null,
        }));
    }
};
exports.UpdatesService = UpdatesService;
exports.UpdatesService = UpdatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UpdatesService);
//# sourceMappingURL=updates.service.js.map