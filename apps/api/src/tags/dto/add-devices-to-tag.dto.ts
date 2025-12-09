import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class AddDevicesToTagDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  deviceIds: string[];
}
