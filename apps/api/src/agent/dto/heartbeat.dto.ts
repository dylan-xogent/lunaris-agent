import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsIP } from 'class-validator';

export class HeartbeatDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  cpuUsage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  memoryUsage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  diskUsage?: number;
}

