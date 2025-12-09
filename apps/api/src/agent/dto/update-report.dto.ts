import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsIn,
} from 'class-validator';

export class UpdateItemDto {
  @IsString()
  @IsNotEmpty()
  packageIdentifier: string;

  @IsString()
  @IsNotEmpty()
  packageName: string;

  @IsOptional()
  @IsString()
  installedVersion?: string;

  @IsString()
  @IsNotEmpty()
  availableVersion: string;

  @IsString()
  @IsIn(['winget', 'windows_update', 'manual'])
  source: string;
}

export class UpdateReportDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateItemDto)
  updates: UpdateItemDto[];
}

