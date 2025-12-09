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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentController = void 0;
const common_1 = require("@nestjs/common");
const agent_service_1 = require("./agent.service");
const register_device_dto_1 = require("./dto/register-device.dto");
const heartbeat_dto_1 = require("./dto/heartbeat.dto");
const update_report_dto_1 = require("./dto/update-report.dto");
const complete_command_dto_1 = require("./dto/complete-command.dto");
let AgentController = class AgentController {
    constructor(agentService) {
        this.agentService = agentService;
    }
    async register(dto) {
        return this.agentService.registerDevice(dto);
    }
    async heartbeat(dto) {
        return this.agentService.processHeartbeat(dto);
    }
    async updateReport(dto) {
        return this.agentService.processUpdateReport(dto);
    }
    async getPendingCommands(deviceId) {
        return this.agentService.getPendingCommands(deviceId);
    }
    async completeCommand(commandId, dto) {
        return this.agentService.completeCommand(commandId, dto);
    }
};
exports.AgentController = AgentController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_device_dto_1.RegisterDeviceDto]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('heartbeat'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [heartbeat_dto_1.HeartbeatDto]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Post)('update-report'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_report_dto_1.UpdateReportDto]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateReport", null);
__decorate([
    (0, common_1.Get)('commands/:deviceId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getPendingCommands", null);
__decorate([
    (0, common_1.Patch)('commands/:commandId/complete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('commandId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, complete_command_dto_1.CompleteCommandDto]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "completeCommand", null);
exports.AgentController = AgentController = __decorate([
    (0, common_1.Controller)('agent'),
    __metadata("design:paramtypes", [agent_service_1.AgentService])
], AgentController);
//# sourceMappingURL=agent.controller.js.map