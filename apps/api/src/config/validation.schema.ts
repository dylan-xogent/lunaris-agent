import { IsString, IsNumber, IsEnum, Min, Max, validateSync } from 'class-validator';
import { plainToClass } from 'class-transformer';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number = 3001;

  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsString()
  DATABASE_URL: string = '';

  @IsNumber()
  @Min(1)
  DATABASE_POOL_MIN: number = 2;

  @IsNumber()
  @Min(1)
  @Max(100)
  DATABASE_POOL_MAX: number = 10;

  @IsNumber()
  @Min(1000)
  DATABASE_CONNECTION_TIMEOUT: number = 10000;

  @IsString()
  CORS_ORIGIN: string = 'http://localhost:3000';

  @IsNumber()
  @Min(10)
  @Max(300)
  AGENT_HEARTBEAT_INTERVAL: number = 30;

  @IsNumber()
  @Min(30)
  @Max(600)
  AGENT_OFFLINE_THRESHOLD: number = 90;

  @IsNumber()
  @Min(1)
  @Max(10)
  AGENT_HEARTBEAT_RETRY_ATTEMPTS: number = 3;

  @IsNumber()
  @Min(1000)
  AGENT_HEARTBEAT_RETRY_DELAY: number = 5000;

  @IsNumber()
  @Min(100)
  WS_RECONNECT_DELAY: number = 1000;

  @IsNumber()
  @Min(1000)
  WS_RECONNECT_MAX_DELAY: number = 30000;

  @IsNumber()
  @Min(1)
  @Max(5)
  WS_RECONNECT_BACKOFF_MULTIPLIER: number = 1.5;

  @IsNumber()
  @Min(50)
  @Max(100)
  HEALTH_CHECK_MEMORY_THRESHOLD_WARNING: number = 75;

  @IsNumber()
  @Min(50)
  @Max(100)
  HEALTH_CHECK_MEMORY_THRESHOLD_CRITICAL: number = 90;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Configuration validation error: ${errors.toString()}`);
  }

  return validatedConfig;
}
