import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class AddDevicesToGroupDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  deviceIds: string[];
}
