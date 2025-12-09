import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class InstallUpdateDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  packageIdentifiers: string[];

  @IsOptional()
  @IsString()
  triggeredBy?: string;
}
