import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class BulkAddTagsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  deviceIds: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tagIds: string[];
}
