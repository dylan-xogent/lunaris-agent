"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.setGlobalPrefix('api');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Lunaris Agent API')
        .setDescription('REST API for Lunaris Agent Platform - Windows update monitoring and management')
        .setVersion('1.0')
        .addTag('agent', 'Agent communication endpoints')
        .addTag('devices', 'Device management endpoints')
        .addTag('updates', 'Update tracking endpoints')
        .addTag('stats', 'Statistics and dashboard endpoints')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 Lunaris API running on http://localhost:${port}`);
    console.log(`📡 WebSocket available on ws://localhost:${port}`);
    console.log(`📚 API Docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map