import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class BulkInstallUpdatesDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  deviceIds: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  packageIdentifiers: string[];
}
