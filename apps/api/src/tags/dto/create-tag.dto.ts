import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6})$/, {
    message: 'Color must be a valid hex color (e.g., #10B981)',
  })
  color?: string;
}
