import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Genre, Status } from '@prisma/client';

export class UpdateCastMemberDto {
  @IsString() @IsOptional() id?: string;
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() key?: string;
}

export class UpdateEpisodeDto {
  @IsString() @IsNotEmpty() id: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() duration?: number;
  @IsOptional() episode_number?: number;
}

export class UpdateSeasonDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  release_date?: string;

}

export class UpdateSeriesDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() description?: string;
  @IsDateString() @IsOptional() release_date?: string;
  @IsEnum(Status) @IsOptional() status?: Status;
  @IsString() @IsOptional() director_name?: string;
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  kids_mode?: boolean;
  @IsString() @IsOptional() category_id?: string;
  @IsArray()
  @IsEnum(Genre, { each: true })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.includes(',')
      ? value.split(',').map((item) => item.trim())
      : typeof value === 'string'
        ? [value]
        : value,
  )
  genres?: Genre[];

  @IsString() @IsOptional() cast_updates?: string;
  @IsString() @IsOptional() episode_updates?: string;

  @IsString()
  @IsOptional()
  season_updates?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'string') return parsed;
      } catch (e) {

      }
      return value.trim();
    }
    return value;
  })
  cast_delete_id?: string;
}
