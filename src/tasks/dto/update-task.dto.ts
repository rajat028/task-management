import { IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description: string;
}
