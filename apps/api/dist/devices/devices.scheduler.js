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
var DevicesScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const devices_service_1 = require("./devices.service");
let DevicesScheduler = DevicesScheduler_1 = class DevicesScheduler {
    constructor(devicesService) {
        this.devicesService = devicesService;
        this.logger = new common_1.Logger(DevicesScheduler_1.name);
    }
    async handleStaleDevices() {
        this.logger.debug('Running stale device detection...');
        try {
            const result = await this.devicesService.markStaleDevicesOffline(1.5);
            if (result.markedOffline > 0) {
                this.logger.log(`Marked ${result.markedOffline} device(s) as offline (stale threshold: 1.5 minutes / 3 missed heartbeats)`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to mark stale devices offline: ${error.message}`, error.stack);
        }
    }
};
exports.DevicesScheduler = DevicesScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DevicesScheduler.prototype, "handleStaleDevices", null);
exports.DevicesScheduler = DevicesScheduler = DevicesScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [devices_service_1.DevicesService])
], DevicesScheduler);
//# sourceMappingURL=devices.scheduler.js.map