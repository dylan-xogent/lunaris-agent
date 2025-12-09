import { IsString, IsOptional, Matches } from 'class-validator';

export class UpdateTagDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6})$/, {
    message: 'Color must be a valid hex color (e.g., #10B981)',
  })
  color?: string;
}
