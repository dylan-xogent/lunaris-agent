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
exports.UpdatesController = void 0;
const common_1 = require("@nestjs/common");
const updates_service_1 = require("./updates.service");
let UpdatesController = class UpdatesController {
    constructor(updatesService) {
        this.updatesService = updatesService;
    }
    async findAll(severity, deviceId, search) {
        return this.updatesService.findAll({ severity, deviceId, search });
    }
};
exports.UpdatesController = UpdatesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('severity')),
    __param(1, (0, common_1.Query)('deviceId')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UpdatesController.prototype, "findAll", null);
exports.UpdatesController = UpdatesController = __decorate([
    (0, common_1.Controller)('updates'),
    __metadata("design:paramtypes", [updates_service_1.UpdatesService])
], UpdatesController);
//# sourceMappingURL=updates.controller.js.map