import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  hostname: string;

  @IsString()
  @IsNotEmpty()
  os: string;

  @IsString()
  @IsNotEmpty()
  osVersion: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, {
    message: 'macAddress must be a valid MAC address',
  })
  macAddress: string;

  @IsString()
  @IsNotEmpty()
  agentVersion: string;
}

