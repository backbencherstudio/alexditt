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

  @IsArray()
  @IsEnum(Category, { each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return [value];
    return value;
  })
  categories?: Category[];

  @IsArray()
  @IsEnum(Genre, { each: true })
  @IsOptional()
  @Transform(({ value }) => {
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
