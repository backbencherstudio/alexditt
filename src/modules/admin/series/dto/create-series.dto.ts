import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  IsEnum,
  ArrayNotEmpty,
  IsDefined,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Category, Genre, Status } from '@prisma/client';

export class CreateSeriesDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  @IsOptional()
  release_date?: string;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;

  @IsString()
  @IsOptional()
  director_name?: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'Kids mode must be a boolean value (true or false).' })
  kids_mode: boolean;

  @IsString()
  @IsNotEmpty({ message: 'Category ID is required' })
  category_id: string;

  @IsArray()
  @IsEnum(Genre, { each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map((item) => item.trim());
    }
    if (typeof value === 'string') return [value];
    return value;
  })
  genres?: Genre[];

  @IsString()
  @IsOptional()
  cast?: string;

  @IsString()
  @IsNotEmpty()
  episodes: string;

  @IsString()
  @IsOptional()
  season_info?: string;
}
