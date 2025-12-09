import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CompleteCommandDto {
  @IsBoolean()
  success: boolean;

  @IsOptional()
  @IsString()
  result?: string;
}
