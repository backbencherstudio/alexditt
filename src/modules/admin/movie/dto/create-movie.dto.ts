import { Transform, Type } from 'class-transformer';
import { Status, Category, Genre } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsArray,
  IsJSON,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;

  @IsString()
  @IsNotEmpty({ message: 'Category ID is required' })
  category_id: string;

  @Transform(({ value, obj, key }) => {
    const rawValue = obj[key];
    if (rawValue === 'true' || rawValue === true) return true;
    if (rawValue === 'false' || rawValue === false) return false;
    if (String(rawValue).trim().toLowerCase() === 'false') return false;
    return String(rawValue).trim().toLowerCase() === 'true';
  })
  @IsBoolean({ message: 'Kids mode must be a boolean value (true or false).' })
  kids_mode: boolean;

  @IsArray()
  @IsEnum(Genre, { each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map(item => item.trim());
    }
    if (typeof value === 'string') return [value];
    return value;
  })
  genres?: Genre[];

  @IsString()
  @IsOptional()
  director_name?: string;

  @Type(() => Date)
  @IsDate()
  release_date: Date;

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsJSON()
  @IsNotEmpty()
  cast: string;
}
