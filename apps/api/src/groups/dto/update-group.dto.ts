import { IsString, IsOptional, Matches } from 'class-validator';

export class UpdateGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6})$/, {
    message: 'Color must be a valid hex color (e.g., #3B82F6)',
  })
  color?: string;
}
