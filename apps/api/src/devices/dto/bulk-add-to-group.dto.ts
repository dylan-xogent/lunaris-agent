import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class BulkAddToGroupDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  deviceIds: string[];

  @IsString()
  @IsNotEmpty()
  groupId: string;
}
