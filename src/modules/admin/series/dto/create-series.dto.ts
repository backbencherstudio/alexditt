import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  IsEnum,
  ArrayNotEmpty,
  IsDefined,
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

  @IsArray()
  @IsEnum(Category, { each: true })
  @ArrayNotEmpty({ message: 'At least one category is required.' })
  @IsDefined({ message: 'Categories field is required.' })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  categories: Category[];

  @IsArray()
  @IsEnum(Genre, { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
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
