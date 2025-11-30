import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEpisodeDto {
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  episode_number: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  duration?: number;

  @IsDateString()
  @IsOptional()
  release_date?: string;

  @IsString()
  @IsNotEmpty({ message: 'Episode key is required.' })
  key: string;
}
