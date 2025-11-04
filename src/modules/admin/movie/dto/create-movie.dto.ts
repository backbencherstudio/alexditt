import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsInt,
  IsArray,
  IsJSON,
} from 'class-validator';

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @Type(() => Date)
  @IsDate()
  release_date: Date;

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  genreIds: string[];

  @IsJSON()
  @IsNotEmpty()
  cast: string;
}
